/**
 * Adaptador Tauri del puerto `WindowManagerPort`.
 *
 * Es el traslado literal de `src/utils/tauriWindows.ts` detrás del puerto: se
 * preserva TODA la lógica anti-zombie (destruir → esperar → recrear, recuperación
 * del falso positivo "already exists" durante hot-reload, timeout de seguridad),
 * porque está afinada contra bugs reales de Tauri v2 en producción.
 */

import { emit, listen } from '@tauri-apps/api/event';
import {
  getCurrentWebviewWindow,
  WebviewWindow,
} from '@tauri-apps/api/webviewWindow';

import {
  PLATFORM_CLOSE_ALL_SECONDARY,
  type SecondaryWindowConfig,
  type SecondaryWindowHandle,
  type WindowManagerPort,
} from '@/platform/ports/windowManager';

const MAIN_WINDOW_LABEL = 'main';

function buildUrl(config: SecondaryWindowConfig): string {
  const queryString = new URLSearchParams({
    windowId: config.windowId,
    windowTitle: config.title,
    ...(config.queryParams ?? {}),
  }).toString();

  return `${config.route}?${queryString}`;
}

function toHandle(windowId: string): SecondaryWindowHandle {
  return {
    id: windowId,
    async close() {
      const win = await WebviewWindow.getByLabel(windowId);
      await win?.close();
    },
    async focus() {
      const win = await WebviewWindow.getByLabel(windowId);
      await win?.setFocus();
    },
    async isOpen() {
      return (await WebviewWindow.getByLabel(windowId)) !== null;
    },
  };
}

async function createWebviewWindow(
  config: SecondaryWindowConfig,
): Promise<WebviewWindow> {
  const {
    windowId,
    title,
    width = 1200,
    height = 800,
    resizable = true,
    center = true,
    x,
    y,
    fullscreen = false,
    alwaysOnTop = false,
    decorations = false,
    transparent = false,
  } = config;

  const url = buildUrl(config);

  const options = {
    url,
    title,
    width,
    height,
    resizable,
    center,
    x: !center ? x : undefined,
    y: !center ? y : undefined,
    fullscreen,
    alwaysOnTop,
    decorations,
    transparent,
  };

  // Siempre destruir la ventana existente antes de crear una nueva.
  // Reutilizar via setFocus() preserva el WebView con su cache de React Query,
  // lo que puede dejar errores cacheados sin posibilidad de recuperación.
  // La estrategia correcta es: destruir → esperar → recrear (fresh context).
  const existingWindow = await WebviewWindow.getByLabel(windowId);
  if (existingWindow) {
    try {
      await existingWindow.close();
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (closeErr) {
      console.error(
        `[TauriWindows] No se pudo cerrar ventana "${windowId}":`,
        closeErr,
      );
    }

    const stillOpen = await WebviewWindow.getByLabel(windowId);
    if (stillOpen) {
      throw new Error(
        `La ventana "${windowId}" no se pudo cerrar correctamente. Por favor ciérrala manualmente.`,
      );
    }
  }

  let win: WebviewWindow;

  try {
    win = new WebviewWindow(windowId, options);
  } catch (constructorError) {
    // Si el constructor falla, probablemente la ventana ya existe pero
    // getByLabel() no la encontró: bug conocido de Tauri durante hot-reload.
    console.error(
      `[TauriWindows] Error en constructor de ventana "${windowId}":`,
      constructorError,
    );

    try {
      const allWindows = await WebviewWindow.getAll();
      const zombieWindow = allWindows.find((w) => w.label === windowId);

      if (!zombieWindow) throw constructorError;

      await zombieWindow.close();
      await new Promise((resolve) => setTimeout(resolve, 500));
      win = new WebviewWindow(windowId, options);
    } catch (recoveryError) {
      console.error(
        `[TauriWindows] No se pudo recuperar del error:`,
        recoveryError,
      );
      throw new Error(
        `No se pudo crear la ventana "${windowId}". ` +
          `Si el problema persiste, cierra manualmente todas las ventanas secundarias y vuelve a intentar.`,
      );
    }
  }

  // Esperar a que la ventana esté lista.
  await new Promise<void>((resolve, reject) => {
    let settled = false;

    win.once('tauri://created', () => {
      if (settled) return;
      settled = true;
      resolve();
    });

    win.once('tauri://error', (error: { payload?: unknown }) => {
      if (settled) return;

      // "already exists" es un falso positivo de Tauri durante hot-reload:
      // la ventana SÍ se creó. Verificamos y resolvemos igual.
      const payload = String(error?.payload ?? '');
      if (payload.includes('already exists')) {
        settled = true;
        setTimeout(async () => {
          try {
            const recovered = await WebviewWindow.getByLabel(windowId);
            if (recovered) resolve();
            else
              reject(
                new Error(`No se pudo verificar la ventana "${windowId}"`),
              );
          } catch (err) {
            reject(err);
          }
        }, 100);
        return;
      }

      settled = true;
      console.error(
        `[TauriWindows] Error creando ventana "${windowId}":`,
        error,
      );
      reject(new Error(`Error creando ventana: ${JSON.stringify(error)}`));
    });

    setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Timeout creando ventana'));
    }, 10_000);
  });

  return win;
}

export const tauriWindowManager: WindowManagerPort = {
  async create(config) {
    await createWebviewWindow(config);
    return toHandle(config.windowId);
  },

  async close(windowId) {
    const win = await WebviewWindow.getByLabel(windowId);
    if (!win) return false;
    await win.close();
    return true;
  },

  async focus(windowId) {
    const win = await WebviewWindow.getByLabel(windowId);
    if (!win) return false;
    try {
      await win.setFocus();
      return true;
    } catch (err) {
      console.warn(
        `[TauriWindows] No se pudo enfocar ventana "${windowId}":`,
        err,
      );
      return false;
    }
  },

  async isOpen(windowId) {
    return (await WebviewWindow.getByLabel(windowId)) !== null;
  },

  async getOpenWindowIds() {
    const windows = await WebviewWindow.getAll();
    return windows
      .map((w) => w.label)
      .filter((label) => label !== MAIN_WINDOW_LABEL);
  },

  async closeAllSecondary() {
    // Aviso primero para que cada ventana cierre desde su propio contexto (la
    // vía sana según `window-entry.tsx`), y cerramos por label como respaldo.
    await emit(PLATFORM_CLOSE_ALL_SECONDARY, null).catch(() => {});

    const windows = await WebviewWindow.getAll();
    await Promise.all(
      windows
        .filter((w) => w.label !== MAIN_WINDOW_LABEL)
        .map((w) => w.close().catch(() => {})),
    );
  },

  async listenToWindowEvent(windowId, eventName, handler) {
    return listen(`${windowId}:${eventName}`, (event) => {
      handler(event.payload as never);
    });
  },

  async emitToWindow(windowId, eventName, data) {
    await emit(`${windowId}:${eventName}`, data);
  },

  async broadcast(topic, payload) {
    await emit(topic, payload);
  },

  async subscribe(topic, handler) {
    return listen(topic, (event) => handler(event.payload));
  },

  getCurrentWindowId() {
    const label = getCurrentWebviewWindow().label;
    return label === MAIN_WINDOW_LABEL ? null : label;
  },

  isSecondaryWindow() {
    return getCurrentWebviewWindow().label !== MAIN_WINDOW_LABEL;
  },

  async onCurrentWindowClose(handler) {
    // Handler SÍNCRONO a propósito: en Tauri v2 un handler async bloquea el
    // cierre hasta que el Promise resuelve, y esa es la causa raíz de las
    // ventanas zombie. Sin preventDefault(), Tauri cierra al retornar.
    const unlisten = await getCurrentWebviewWindow().onCloseRequested(() => {
      handler();
    });
    return unlisten;
  },

  async closeCurrentWindow() {
    await getCurrentWebviewWindow().close();
  },
};
