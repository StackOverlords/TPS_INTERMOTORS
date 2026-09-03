/**
 * Punto de entrada de la capa de plataforma.
 *
 * El código de negocio pide capacidades acá y nunca importa `@tauri-apps/*`
 * ni toca APIs del navegador directamente. Cambiar de target = cambiar de
 * adaptador, no de código de negocio.
 *
 * ── Por qué los dos adaptadores se importan estáticamente ────────────────────
 * La alternativa (import dinámico según el target) haría asíncrona la resolución,
 * y eso ROMPE el adaptador web: `window.open()` debe correr dentro del gesto del
 * usuario y un `await` previo lo invalida. Por eso resolvemos síncrono y pagamos
 * el precio de que el bundle web incluya el adaptador Tauri.
 *
 * Ese peso es una optimización posterior, no un problema de corrección: el
 * adaptador Tauri nunca se ejecuta en el navegador. Cuando el target web se
 * confirme, se reemplaza por un alias de Vite (`@/platform/adapters/active`)
 * resuelto en build, sin tocar un solo consumidor.
 */

import { tauriWindowManager } from './adapters/tauri/windowManager';
import { webWindowManager } from './adapters/web/windowManager';
import { isTauri } from './env';
import type { WindowManagerPort } from './ports/windowManager';

export { getPlatformTarget, isTauri } from './env';
export type { PlatformTarget } from './env';
export { PLATFORM_CLOSE_ALL_SECONDARY } from './ports/windowManager';
export type {
  SecondaryWindowConfig,
  SecondaryWindowHandle,
  WindowManagerPort,
} from './ports/windowManager';

let windowManagerInstance: WindowManagerPort | null = null;

/**
 * Adaptador de ventanas del target activo.
 *
 * Resolución perezosa y cacheada: al momento de importar este módulo el runtime
 * de Tauri podría no haber inyectado todavía sus globals, así que decidimos en
 * el primer uso real. Sigue siendo síncrono — seguro para el gesto del usuario.
 */
export function getWindowManager(): WindowManagerPort {
  if (!windowManagerInstance) {
    windowManagerInstance = isTauri() ? tauriWindowManager : webWindowManager;
  }
  return windowManagerInstance;
}
