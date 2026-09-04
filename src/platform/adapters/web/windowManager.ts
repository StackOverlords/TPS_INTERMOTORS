/**
 * Adaptador web del puerto `WindowManagerPort`.
 *
 * Mapea el modelo multi-ventana de Tauri a primitivas del navegador:
 *
 *  | Tauri                          | Web                                  |
 *  |--------------------------------|--------------------------------------|
 *  | `new WebviewWindow(label,opts)` | `window.open(url, name, features)`   |
 *  | `emit` / `listen`              | `BroadcastChannel` (mismo origen)    |
 *  | `onCloseRequested`             | `beforeunload`                       |
 *  | `WebviewWindow.getAll()`       | registro local + broadcast de cierre |
 *
 * ⚠️ REGLA CRÍTICA — bloqueo de popups
 * `window.open()` solo se permite DENTRO del gesto del usuario. Un `await` previo
 * termina la tarea del gesto y el navegador bloquea la ventana SIN lanzar error
 * (devuelve `null`). Por eso `create()` abre la ventana en su primera sentencia,
 * antes de cualquier `await`: el cuerpo de una `async function` corre síncrono
 * hasta el primer `await`, así que la cadena onClick → open() → create() →
 * window.open() sigue siendo un solo turno síncrono.
 *
 * No toques ese orden sin volver a leer esta nota.
 */

import {
  PLATFORM_CLOSE_ALL_SECONDARY,
  type SecondaryWindowConfig,
  type SecondaryWindowHandle,
  type WindowManagerPort,
} from '@/platform/ports/windowManager';

/** Canal único; los mensajes se enrutan por `topic`. */
const CHANNEL_NAME = 'tps:windows';

interface ChannelMessage {
  topic: string;
  payload: unknown;
}

type TopicHandler = (payload: unknown) => void;

/** Ventanas abiertas POR ESTE contexto. Se pierde al recargar (ver `closeAllSecondary`). */
const openWindows = new Map<string, Window>();

/** Evita emitir `window-closed` dos veces (beforeunload de la hija + poll del padre). */
const closeNotified = new Set<string>();

const subscribers = new Map<string, Set<TopicHandler>>();

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (channel) return channel;

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
    const { topic, payload } = event.data ?? {};
    if (typeof topic !== 'string') return;
    dispatchLocal(topic, payload);
  };

  return channel;
}

function dispatchLocal(topic: string, payload: unknown): void {
  const handlers = subscribers.get(topic);
  if (!handlers) return;
  for (const handler of handlers) {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[WebWindows] Handler de "${topic}" lanzó:`, err);
    }
  }
}

/**
 * Publica en el canal y además despacha localmente.
 *
 * `BroadcastChannel` NO entrega al contexto que envía, pero `emit` de Tauri sí
 * alcanza a los listeners de la propia ventana. Replicamos esa semántica para
 * que un mismo código se comporte igual en los dos targets.
 */
function publish(topic: string, payload: unknown): void {
  getChannel().postMessage({ topic, payload } satisfies ChannelMessage);
  dispatchLocal(topic, payload);
}

function subscribeTopic(topic: string, handler: TopicHandler): () => void {
  getChannel(); // asegura que el canal esté escuchando

  let handlers = subscribers.get(topic);
  if (!handlers) {
    handlers = new Set();
    subscribers.set(topic, handlers);
  }
  handlers.add(handler);

  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) subscribers.delete(topic);
  };
}

function buildUrl(config: SecondaryWindowConfig): string {
  const params = new URLSearchParams({
    windowId: config.windowId,
    windowTitle: config.title,
    ...(config.queryParams ?? {}),
    // Fuerza una carga fresca: `window.open` con un `name` ya usado REUTILIZA la
    // ventana, y sin cambiar la URL el navegador puede no recargarla. Equivale
    // al "destruir → recrear" del adaptador Tauri (contexto limpio, sin cache
    // de React Query heredado de la sesión anterior).
    _ts: String(Date.now()),
  });

  return `${config.route}?${params.toString()}`;
}

/**
 * Traduce la config a la cadena `features` de `window.open`.
 *
 * Sin equivalente en web (se ignoran): `decorations`, `transparent`,
 * `alwaysOnTop`, `fullscreen`. El navegador controla el chrome de la ventana.
 */
function buildFeatures(config: SecondaryWindowConfig): string {
  const {
    width = 1200,
    height = 800,
    resizable = true,
    center = true,
    x,
    y,
  } = config;

  let left = x ?? 0;
  let top = y ?? 0;

  if (center) {
    // `screen.availWidth/Height` descuenta barras del SO; en multi-monitor abre
    // en la pantalla principal, que es el comportamiento aceptable por defecto.
    left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
    top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
  }

  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    `resizable=${resizable ? 'yes' : 'no'}`,
    'scrollbars=yes',
    // Nunca agregar `noopener`: hace que `window.open` devuelva `null` y
    // perdemos la referencia con la que cerramos y enfocamos la ventana.
  ].join(',');
}

/**
 * Vigila el cierre de una ventana hija.
 *
 * La ruta principal es el `beforeunload` de la hija (emite `window-closed` desde
 * su propio contexto). Este poll es la red de seguridad para el caso en que la
 * hija muera sin poder emitir (crash del tab, cierre forzado del navegador).
 */
function watchForClose(windowId: string, proxy: Window): void {
  const interval = setInterval(() => {
    if (!proxy.closed) return;

    clearInterval(interval);
    openWindows.delete(windowId);

    if (closeNotified.has(windowId)) {
      closeNotified.delete(windowId);
      return;
    }

    closeNotified.add(windowId);
    publish(`${windowId}:window-closed`, { canceled: false });
    // La marca se limpia al reabrir; ver `create()`.
  }, 500);
}

function toHandle(windowId: string): SecondaryWindowHandle {
  return {
    id: windowId,
    async close() {
      openWindows.get(windowId)?.close();
      openWindows.delete(windowId);
    },
    async focus() {
      openWindows.get(windowId)?.focus();
    },
    async isOpen() {
      const proxy = openWindows.get(windowId);
      return Boolean(proxy && !proxy.closed);
    },
  };
}

export const webWindowManager: WindowManagerPort = {
  async create(config) {
    // ⚠️ PRIMERA sentencia, antes de cualquier `await`. Ver nota de arriba.
    const proxy = window.open(
      buildUrl(config),
      config.windowId,
      buildFeatures(config),
    );

    if (!proxy) {
      throw new Error(
        `El navegador bloqueó la ventana "${config.windowId}". ` +
          `Habilitá las ventanas emergentes para este sitio e intentá de nuevo.`,
      );
    }

    closeNotified.delete(config.windowId);
    openWindows.set(config.windowId, proxy);
    watchForClose(config.windowId, proxy);

    try {
      proxy.document.title = config.title;
    } catch {
      // El documento todavía no cargó; `window.html` pone su propio <title>.
    }

    return toHandle(config.windowId);
  },

  async close(windowId) {
    const proxy = openWindows.get(windowId);
    if (!proxy || proxy.closed) {
      openWindows.delete(windowId);
      return false;
    }
    proxy.close();
    openWindows.delete(windowId);
    return true;
  },

  async focus(windowId) {
    const proxy = openWindows.get(windowId);
    if (!proxy || proxy.closed) return false;
    try {
      proxy.focus();
      return true;
    } catch (err) {
      console.warn(
        `[WebWindows] No se pudo enfocar ventana "${windowId}":`,
        err,
      );
      return false;
    }
  },

  async isOpen(windowId) {
    const proxy = openWindows.get(windowId);
    if (!proxy) return false;
    if (proxy.closed) {
      openWindows.delete(windowId);
      return false;
    }
    return true;
  },

  async getOpenWindowIds() {
    const ids: string[] = [];
    for (const [id, proxy] of openWindows) {
      if (proxy.closed) openWindows.delete(id);
      else ids.push(id);
    }
    return ids;
  },

  async closeAllSecondary() {
    for (const [id, proxy] of openWindows) {
      if (!proxy.closed) proxy.close();
      openWindows.delete(id);
    }

    // Tras un reload del main perdimos las referencias, pero las ventanas hijas
    // siguen vivas. El broadcast llega igual y cada una se cierra sola —
    // equivalente al `WebviewWindow.getAll()` de Tauri, que sobrevive al reload.
    publish(PLATFORM_CLOSE_ALL_SECONDARY, null);
  },

  async listenToWindowEvent(windowId, eventName, handler) {
    return subscribeTopic(`${windowId}:${eventName}`, (payload) => {
      handler(payload as never);
    });
  },

  async emitToWindow(windowId, eventName, data) {
    publish(`${windowId}:${eventName}`, data);
  },

  async broadcast(topic, payload) {
    publish(topic, payload ?? null);
  },

  async subscribe(topic, handler) {
    return subscribeTopic(topic, handler);
  },

  getCurrentWindowId() {
    return new URLSearchParams(window.location.search).get('windowId');
  },

  isSecondaryWindow() {
    return this.getCurrentWindowId() !== null;
  },

  async onCurrentWindowClose(handler) {
    const onBeforeUnload = () => handler();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  },

  async closeCurrentWindow() {
    window.close();
  },
};
