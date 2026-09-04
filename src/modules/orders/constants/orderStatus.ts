/**
 * Estados de un pedido: letra que devuelve el backend → nombre visible.
 *
 * Vive acá y no en el componente del selector porque exportar constantes desde
 * un archivo de componentes rompe el fast refresh de React.
 */
export const ORDER_STATUS_MAP: Record<string, string> = {
  P: 'Preparación',
  C: 'Cotización',
  T: 'Tránsito',
  A: 'Almacén',
  D: 'Disponible',
};

/** Estado por defecto del selector cuando la URL no trae uno. */
export const DEFAULT_ORDER_STATUS = 'A';
