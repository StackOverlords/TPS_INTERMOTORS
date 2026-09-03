/**
 * Detección del host de ejecución.
 *
 * La app corre en dos targets con el MISMO código de negocio:
 *  - `tauri`: shell de escritorio (webview del SO + backend Rust).
 *  - `web`:   navegador, servida como estática desde el `public/` del backend.
 *
 * La detección es SÍNCRONA a propósito. Los adaptadores se resuelven sin `await`
 * porque `window.open()` del adaptador web debe ejecutarse dentro del gesto del
 * usuario: cualquier `await` previo rompe esa cadena y el navegador bloquea el
 * popup en silencio. Ver `platform/adapters/web/windowManager.ts`.
 */

export type PlatformTarget = 'tauri' | 'web';

/**
 * `__TAURI_INTERNALS__` lo inyecta el runtime de Tauri v2 en cada webview.
 * `__TAURI__` aparece además cuando `withGlobalTauri: true` (nuestro caso, ver
 * `src-tauri/tauri.conf.json`). Chequeamos los dos: el primero es el contrato
 * real de v2, el segundo es la red de seguridad si cambia el flag.
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}

export function getPlatformTarget(): PlatformTarget {
  return isTauri() ? 'tauri' : 'web';
}
