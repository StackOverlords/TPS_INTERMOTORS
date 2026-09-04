/**
 * Puerto: control del marco de la ventana actual.
 *
 * En escritorio la app corre sin decoraciones del SO (`decorations: false` en
 * `tauri.conf.json`) y dibuja su propia barra de título: minimizar, maximizar,
 * cerrar y arrastrar son responsabilidad nuestra.
 *
 * En el navegador ese marco lo pone el navegador. `hasCustomChrome()` existe
 * para que la UI esconda esos controles en vez de renderizar botones que no
 * pueden hacer nada.
 */

export interface WindowChromePort {
  /**
   * `true` si la app dibuja su propia barra de título y los controles de
   * ventana tienen sentido. `false` en web.
   */
  hasCustomChrome(): boolean;

  minimize(): Promise<void>;
  /** Alterna maximizado. En web es la API de pantalla completa. */
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;

  /** Notifica cambios de maximizado. Devuelve la función de limpieza. */
  onMaximizeChange(handler: (maximized: boolean) => void): Promise<() => void>;

  /** Inicia el arrastre de la ventana desde la barra de título. */
  startDragging(): Promise<void>;

  /** Ajusta el nivel de zoom de la vista (1 = 100%). */
  setZoom(level: number): Promise<void>;
}
