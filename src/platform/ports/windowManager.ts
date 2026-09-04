/**
 * Puerto: gestión de ventanas secundarias.
 *
 * Es el contrato que el código de negocio consume. No menciona a Tauri ni al
 * navegador: cada target provee su adaptador en `platform/adapters/<target>/`.
 *
 * Modelo de ventana secundaria (idéntico en ambos targets):
 *  - Se abre `/window.html?windowId=<id>&component=<id>&…` — un documento aparte
 *    con su propio árbol de React (`src/window-entry.tsx`).
 *  - La comunicación padre↔hija es por eventos con nombre `"<windowId>:<evento>"`.
 *  - La ventana hija avisa su propio cierre emitiendo `"<windowId>:window-closed"`
 *    desde su contexto (nunca desde el padre — ver nota en `window-entry.tsx`).
 */

/**
 * Topic global: pide a toda ventana secundaria que se cierre sola.
 *
 * Lo emite `closeAllSecondary()` en ambos targets y lo consume `window-entry.tsx`.
 * Es la única vía que funciona después de que la ventana principal recarga: ahí
 * el target web pierde las referencias a los popups que abrió, pero los popups
 * siguen vivos y escuchando.
 */
export const PLATFORM_CLOSE_ALL_SECONDARY = 'platform:close-all-secondary';

/** Configuración para crear una ventana secundaria. */
export interface SecondaryWindowConfig {
  /** ID único de la ventana en toda la aplicación. */
  windowId: string;
  /** Documento a cargar. Hoy siempre `/window.html`. */
  route: string;
  title: string;
  /** Ancho inicial en píxeles. */
  width?: number;
  /** Alto inicial en píxeles. */
  height?: number;
  resizable?: boolean;
  /** Centrar en pantalla. Si es `false` se usan `x`/`y`. */
  center?: boolean;
  x?: number;
  y?: number;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
  /** Decoraciones nativas (barra de título del SO). Sin efecto en `web`. */
  decorations?: boolean;
  /** Fondo transparente. Sin efecto en `web`. */
  transparent?: boolean;
  /** Query params extra que se agregan a la URL de la ventana. */
  queryParams?: Record<string, string>;
}

/**
 * Referencia neutral a una ventana abierta.
 *
 * Reemplaza al `WebviewWindow` de Tauri que antes se filtraba hasta los hooks.
 * Se mantiene mínima a propósito: hoy ningún consumidor usaba el handle más allá
 * de cerrarlo o enfocarlo, así que no exponemos superficie que nadie pide.
 */
export interface SecondaryWindowHandle {
  readonly id: string;
  close(): Promise<void>;
  focus(): Promise<void>;
  isOpen(): Promise<boolean>;
}

export interface WindowManagerPort {
  // ── ciclo de vida ─────────────────────────────────────────────────────────
  /**
   * Crea (o recrea con contexto fresco) una ventana secundaria.
   *
   * ⚠️ Contrato para los consumidores: llamalo SÍNCRONAMENTE dentro del handler
   * del gesto del usuario. El adaptador web abre el popup antes de su primer
   * `await`; si el llamador mete un `await` previo, el navegador lo bloquea.
   */
  create(config: SecondaryWindowConfig): Promise<SecondaryWindowHandle>;
  close(windowId: string): Promise<boolean>;
  focus(windowId: string): Promise<boolean>;
  isOpen(windowId: string): Promise<boolean>;
  /** IDs de las ventanas secundarias abiertas (excluye la principal). */
  getOpenWindowIds(): Promise<string[]>;
  /** Cierra todas las secundarias. Defensa anti-huérfanas al arrancar el main. */
  closeAllSecondary(): Promise<void>;

  // ── eventos dirigidos a una ventana ───────────────────────────────────────
  /** Escucha `"<windowId>:<eventName>"`. Devuelve la función de limpieza. */
  listenToWindowEvent<T = unknown>(
    windowId: string,
    eventName: string,
    handler: (data: T) => void,
  ): Promise<() => void>;
  emitToWindow<T = unknown>(
    windowId: string,
    eventName: string,
    data: T,
  ): Promise<void>;

  // ── canal global (heartbeat del main, avisos a todas las ventanas) ────────
  broadcast(topic: string, payload?: unknown): Promise<void>;
  subscribe(
    topic: string,
    handler: (payload: unknown) => void,
  ): Promise<() => void>;

  // ── contexto de la ventana actual ─────────────────────────────────────────
  /** `windowId` de esta ventana, o `null` si es la principal. */
  getCurrentWindowId(): string | null;
  isSecondaryWindow(): boolean;
  /**
   * Registra un handler que corre cuando ESTA ventana se está cerrando.
   * Debe ser síncrono: en ambos targets el cierre no espera promesas.
   */
  onCurrentWindowClose(handler: () => void): Promise<() => void>;
  closeCurrentWindow(): Promise<void>;
}
