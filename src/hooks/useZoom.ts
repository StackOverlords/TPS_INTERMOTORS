import { useCommand } from '@/keybindings';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useCallback, useEffect, useState } from 'react';

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STORAGE_KEY = 'app_zoom_level';

// Helper seguro para obtener la ventana actual
const getAppWindow = () => {
  try {
    // @ts-ignore - __TAURI__ might not be in types
    if (typeof window !== 'undefined' && window.__TAURI__) {
      return WebviewWindow.getCurrent();
    }
  } catch (e) {
    console.warn('Tauri API not available');
  }
  return null;
};

export function useZoom() {
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const setZoom = useCallback(async (level: number) => {
    try {
      // Limitar el zoom
      const newLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
      
      // Aplicar a la ventana actual de Tauri si está disponible
      const appWindow = getAppWindow();
      if (appWindow) {
        await appWindow.setZoom(newLevel);
      } else {
        // Fallback para navegador (opcional, usando CSS zoom o transform)
        // Por ahora solo actualizamos el estado para que la UI refleje el cambio
        document.body.style.zoom = `${newLevel}`;
      }
      
      // Actualizar estado y guardar
      setZoomLevel(newLevel);
      localStorage.setItem(ZOOM_STORAGE_KEY, newLevel.toString());
    } catch (error) {
      console.error('Error setting zoom level:', error);
    }
  }, []);

  useEffect(() => {
    // Cargar zoom guardado al iniciar
    const savedZoom = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (savedZoom) {
      const parsed = parseFloat(savedZoom);
      if (!isNaN(parsed)) {
        setZoom(parsed);
      }
    }
  }, [setZoom]);

  const zoomIn = useCallback(() => setZoom(zoomLevel + ZOOM_STEP), [zoomLevel, setZoom]);
  const zoomOut = useCallback(() => setZoom(zoomLevel - ZOOM_STEP), [zoomLevel, setZoom]);
  const zoomReset = useCallback(() => setZoom(1.0), [setZoom]);

  // Registrar comandos
  useCommand('actions.zoomIn', zoomIn);
  useCommand('actions.zoomOut', zoomOut);
  useCommand('actions.zoomReset', zoomReset);

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    zoomReset,
    setZoom
  };
}
