import { getAllWebviewWindows, getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useEffect } from 'react';

// Hook para cerrar ventanas secundarias al salir de la app
export function useCloseSecondaryWindowsOnExit() {
  useEffect(() => {
    const currentWindow = getCurrentWebviewWindow();

    // Solo ejecutar en la ventana principal
    if (currentWindow.label !== 'main') {
      return;
    }

    // Listener para cuando se va a cerrar la ventana principal
    const unlisten = currentWindow.onCloseRequested(async () => {
      try {
        // Obtener todas las ventanas
        const allWindows = await getAllWebviewWindows();

        // Cerrar todas las ventanas secundarias (excepto 'main')
        const closePromises = allWindows
          .filter(window => window.label !== 'main')
          .map(async (window) => {
            try {
              console.log(`[CloseSecondaryWindows] Cerrando ventana: ${window.label}`);
              await window.close();
            } catch (error) {
              console.error(`[CloseSecondaryWindows] Error cerrando ${window.label}:`, error);
            }
          });

        // Esperar a que todas se cierren
        await Promise.all(closePromises);

        console.log('[CloseSecondaryWindows] Todas las ventanas secundarias cerradas');
      } catch (error) {
        console.error('[CloseSecondaryWindows] Error en cleanup:', error);
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);
}
