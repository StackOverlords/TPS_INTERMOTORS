import { getWindowManager } from '@/platform';
import { useEffect } from 'react';

/**
 * Cierra las ventanas secundarias cuando la ventana principal se está cerrando.
 *
 * El handler es SÍNCRONO y dispara el cierre fire-and-forget. La versión previa
 * usaba un handler `async` que esperaba a que todas cerraran: en Tauri v2 eso
 * bloquea el cierre hasta que el Promise resuelve, y es exactamente la causa
 * raíz de las ventanas zombie ya documentada en `window-entry.tsx` y `main.tsx`.
 * Este hook ahora sigue esa misma regla.
 *
 * Red de seguridad independiente: el heartbeat de `main.tsx` — si el pulso se
 * corta por más de 5s, cada ventana secundaria se auto-cierra.
 */
export function useCloseSecondaryWindowsOnExit() {
  useEffect(() => {
    const windows = getWindowManager();

    // Solo la ventana principal orquesta el cierre.
    if (windows.isSecondaryWindow()) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;

    windows
      .onCurrentWindowClose(() => {
        windows.closeAllSecondary().catch((error) => {
          console.error('[CloseSecondaryWindows] Error en cleanup:', error);
        });
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch((error) => {
        console.error(
          '[CloseSecondaryWindows] No se pudo registrar el handler de cierre:',
          error,
        );
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);
}
