import { useZoom } from '@/hooks/useZoom';

/**
 * Componente invisible que inicializa y gestiona el zoom de la aplicación
 * Debe colocarse dentro del árbol de componentes principal
 */
export function ZoomManager() {
  useZoom();
  return null;
}
