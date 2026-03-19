import { emit, listen } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * Configuración para crear una ventana secundaria
 */
export interface SecondaryWindowConfig {
  // ID único de la ventana (debe ser único en toda la aplicación)
  windowId: string;
  route: string;
  title: string;
  // Ancho inicial en píxeles
  width?: number;
  // Alto inicial en píxeles
  height?: number;
  // Si la ventana puede redimensionarse
  resizable?: boolean;
  // Si la ventana debe centrarse en la pantalla
  center?: boolean;
  // Posición X inicial (si center es false)
  x?: number;
  // Posición Y inicial (si center es false)
  y?: number;
  // Si debe mostrarse en pantalla completa
  fullscreen?: boolean;
  // Si debe estar siempre al frente
  alwaysOnTop?: boolean;
  // Si debe tener decoraciones (botones de cerrar, minimizar, etc)
  decorations?: boolean;
  // Si debe ser transparente
  transparent?: boolean;
  // Query params adicionales para pasar a la ruta
  queryParams?: Record<string, string>;
}

export async function createSecondaryWindow(
  config: SecondaryWindowConfig
): Promise<WebviewWindow> {
  const {
    windowId,
    route,
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
    queryParams = {},
  } = config;

  // Siempre destruir la ventana existente antes de crear una nueva.
  // Reutilizar via setFocus() preserva el WebView con su cache de React Query,
  // lo que puede dejar errores cacheados sin posibilidad de recuperación.
  // La estrategia correcta es: destruir → esperar → recrear (fresh context).
  const existingWindow = await WebviewWindow.getByLabel(windowId);
  if (existingWindow) {
    console.log(`[TauriWindows] Ventana "${windowId}" existe, destruyéndola para recrear con contexto fresco`);
    try {
      await existingWindow.close();
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (closeErr) {
      console.error(`[TauriWindows] No se pudo cerrar ventana "${windowId}":`, closeErr);
    }
    const stillOpen = await WebviewWindow.getByLabel(windowId);
    if (stillOpen) {
      throw new Error(`La ventana "${windowId}" no se pudo cerrar correctamente. Por favor ciérrala manualmente.`);
    }
  }

  // Construir URL con query params
  const queryString = new URLSearchParams({
    windowId,
    windowTitle: title,
    ...queryParams,
  }).toString();

  const url = `${route}?${queryString}`;

  // Crear nueva ventana con manejo de errores mejorado
  let window: WebviewWindow;

  try {
    window = new WebviewWindow(windowId, {
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
    });
  } catch (constructorError: any) {
    // Si el constructor falla, probablemente la ventana ya existe pero getByLabel() no la encontró
    // Esto es un bug conocido de Tauri durante hot-reload
    console.error(`[TauriWindows] Error en constructor de ventana "${windowId}":`, constructorError);

    // Intentar obtener todas las ventanas y cerrar la que tenga este label
    try {
      const allWindows = await WebviewWindow.getAll();
      console.log(`[TauriWindows] Ventanas abiertas:`, allWindows.map(w => w.label));

      const zombieWindow = allWindows.find(w => w.label === windowId);
      if (zombieWindow) {
        console.log(`[TauriWindows] Encontrada ventana zombie "${windowId}", cerrándola...`);
        await zombieWindow.close();
        await new Promise(resolve => setTimeout(resolve, 500));

        // Reintentar crear la ventana
        window = new WebviewWindow(windowId, {
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
        });
      } else {
        throw constructorError;
      }
    } catch (recoveryError) {
      console.error(`[TauriWindows] No se pudo recuperar del error:`, recoveryError);
      throw new Error(
        `No se pudo crear la ventana "${windowId}". ` +
        `Si el problema persiste, cierra manualmente todas las ventanas secundarias y vuelve a intentar.`
      );
    }
  }

  // Esperar a que la ventana esté lista
  await new Promise<void>((resolve, reject) => {
    let resolved = false;

    window.once('tauri://created', () => {
      if (!resolved) {
        resolved = true;
        console.log(`[TauriWindows] Ventana "${windowId}" creada exitosamente`);
        resolve();
      }
    });

    window.once('tauri://error', (error: any) => {
      if (!resolved) {
        // Si el error es "already exists", es un falso positivo de Tauri durante hot-reload
        // La ventana SÍ se creó correctamente, solo necesitamos ignorar este error
        if (error?.payload?.includes('already exists')) {
          console.log(`[TauriWindows] Ignorando error de Tauri (falso positivo): ventana "${windowId}" creada OK`);

          // Esperar un poco y resolver de todas formas (la ventana se creó)
          setTimeout(async () => {
            resolved = true;
            try {
              const recovered = await WebviewWindow.getByLabel(windowId);
              if (recovered) {
                // No loggear como "recuperada" porque nunca falló realmente
                resolve();
              } else {
                reject(new Error(`No se pudo verificar la ventana "${windowId}"`));
              }
            } catch (err) {
              reject(err);
            }
          }, 100);
        } else {
          // Este sí es un error real
          resolved = true;
          console.error(`[TauriWindows] Error creando ventana "${windowId}":`, error);
          reject(new Error(`Error creando ventana: ${JSON.stringify(error)}`));
        }
      }
    });

    // Timeout de seguridad (10 segundos)
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Timeout creando ventana'));
      }
    }, 10000);
  });

  return window;
}

export async function closeSecondaryWindow(windowId: string): Promise<boolean> {
  const window = await WebviewWindow.getByLabel(windowId);
  if (!window) {
    console.warn(`[TauriWindows] Ventana "${windowId}" no encontrada`);
    return false;
  }

  await window.close();
  console.log(`[TauriWindows] Ventana "${windowId}" cerrada`);
  return true;
}


export async function getSecondaryWindow(windowId: string): Promise<WebviewWindow | null> {
  return await WebviewWindow.getByLabel(windowId);
}

export async function isWindowOpen(windowId: string): Promise<boolean> {
  const window = await WebviewWindow.getByLabel(windowId);
  return window !== null;
}

export async function focusSecondaryWindow(windowId: string): Promise<boolean> {
  const window = await WebviewWindow.getByLabel(windowId);
  if (!window) return false;

  try {
    await window.setFocus();
    return true;
  } catch (err) {
    console.warn(`[TauriWindows] No se pudo enfocar ventana "${windowId}":`, err);
    return false;
  }
}

export async function listenToWindowEvent<T = any>(
  windowId: string,
  eventName: string,
  handler: (data: T) => void
): Promise<() => void> {
  const fullEventName = `${windowId}:${eventName}`;

  console.log(`[TauriWindows] 📡 Registrando listener global para "${fullEventName}"`);

  const unlisten = await listen<T>(fullEventName, (event) => {
    console.log(`[TauriWindows] Evento recibido "${fullEventName}":`, event.payload);
    handler(event.payload);
  });

  return () => {
    console.log(`[TauriWindows] 🧹 Limpiando listener global para "${fullEventName}"`);
    unlisten();
  };
}

export async function emitToWindow<T = any>(
  windowId: string,
  eventName: string,
  data: T
): Promise<void> {
  const fullEventName = `${windowId}:${eventName}`;
  console.log(`[TauriWindows] Emitiendo evento "${fullEventName}":`, data);
  await emit(fullEventName, data);
}

// Lista de todas las ventanas abiertas
export async function getAllOpenWindows(): Promise<string[]> {
  const windows = await WebviewWindow.getAll();
  if (windows) {
    return windows.map((w: WebviewWindow) => w.label);
  } else {
    return [];
  }
}


// // Tipos de eventos comunes que pueden emitir las ventanas
// export const WINDOW_EVENTS = {
//   PRODUCT_SELECTED: 'product-selected',
//   PRODUCT_MULTI_SELECTED: 'product-multi-selected',
//   WINDOW_CLOSED: 'window-closed',

//   DATA_UPDATED: 'data-updated',
//   CANCEL: 'cancel',
//   CONFIRM: 'confirm',
// } as const;

// export type WindowEventType = typeof WINDOW_EVENTS[keyof typeof WINDOW_EVENTS];
