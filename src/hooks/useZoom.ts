import { useCommand } from '@/keybindings';
import { getWindowChrome } from '@/platform';
import { useCallback, useEffect, useState } from 'react';

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STORAGE_KEY = 'app_zoom_level';

export function useZoom() {
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const setZoom = useCallback(async (level: number) => {
    try {
      // Limitar el zoom
      const newLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
      
      // El puerto resuelve el mecanismo: zoom nativo del webview en escritorio,
      // `zoom` de CSS en el navegador.
      await getWindowChrome().setZoom(newLevel);
      
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
