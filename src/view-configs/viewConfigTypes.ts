import type { ColumnOrderState, VisibilityState } from '@tanstack/react-table';

export interface ViewFeatureConfig {
  enabled: boolean;
  label?: string;
  description?: string;
}

export interface ViewFeaturesConfig {
  // Controles de UI
  infiniteScroll?: ViewFeatureConfig;
  refreshButton?: ViewFeatureConfig;
  resetTableButton?: ViewFeatureConfig;
  columnSelector?: ViewFeatureConfig;
  filters?: ViewFeatureConfig;
  exportButton?: ViewFeatureConfig;
  multiSelect?: ViewFeatureConfig;
  pagination?: ViewFeatureConfig;
  keyboardNavigation?: ViewFeatureConfig;
  searchBar?: ViewFeatureConfig;

  // Acciones específicas
  createButton?: ViewFeatureConfig;
  editButton?: ViewFeatureConfig;
  deleteButton?: ViewFeatureConfig;
  duplicateButton?: ViewFeatureConfig;

  // Features personalizadas (extensible)
  permissions?: ViewFeatureConfig;
  saveButton?: ViewFeatureConfig;

  // Carrito de pedido (order-cart)
  addToOrderCart?: ViewFeatureConfig;
  bulkAddToOrderCart?: ViewFeatureConfig;
  seedFromOrderCart?: ViewFeatureConfig;
  seedFromOrderCartSelective?: ViewFeatureConfig;

  [key: string]: ViewFeatureConfig | undefined;
}

/**
 * Comportamientos específicos de la tabla
 */
export interface TableBehaviorsConfig {
  // ✅ Persistencia - QUÉ se guarda
  persistColumnVisibility?: boolean;
  persistColumnOrder?: boolean;
  persistColumnSizes?: boolean;
  persistPagination?: boolean;
  persistSorting?: boolean;
  persistFilters?: boolean;

  // Configuración de tabla
  enableColumnReordering?: boolean;
  enableColumnResizing?: boolean;
  columnResizeMode?: 'onChange' | 'onEnd';
  minColumnWidth?: number;
  maxColumnWidth?: number;

  // Paginación
  defaultPageSize?: number;
  pageSizeOptions?: number[];

  // Ordenamiento
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';
  allowMultiSort?: boolean;

  // Selección
  allowBulkActions?: boolean;
  clearSelectionOnPageChange?: boolean;
  maxSelectableItems?: number;

  // Virtualización (para tablas grandes)
  enableVirtualization?: boolean;
  virtualScrollOverscan?: number;

  // Rendimiento
  debounceMs?: number;
}

/**
 * Estado de la tabla persistido en Tauri Store
 */
export interface TableState {
  // Visibilidad de columnas
  columnVisibility?: VisibilityState;
  
  // Orden de columnas
  columnOrder?: ColumnOrderState;
  
  // Tamaños de columnas (key = columnId, value = width en px)
  columnSizes?: Record<string, number>;
  
  // Estado de paginación
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  
  // Estado de ordenamiento
  sorting?: Array<{
    id: string;
    desc: boolean;
  }>;
  
  // Filtros guardados
  filters?: Record<string, any>;
  
  // Timestamp de última actualización
  _updatedAt?: string;
}

/**
 * Configuración completa de tabla
 */
export interface TableConfig {
  // Comportamientos de la tabla
  behaviors?: TableBehaviorsConfig;
  
  // Estado persistido
  state?: TableState;
}

export interface ViewBehaviorsConfig {
  // Modos de interacción
  productSelectorMode?: 'embedded' | 'modal' | 'window';
  openDetailsIn?: 'same-page' | 'new-tab' | 'modal' | 'window';

  // Búsqueda y filtros (NO de tabla)
  defaultSearchMode?: 'realtime' | 'manual';
  autoApplyFilters?: boolean;
  clearFiltersOnMount?: boolean;
  resetFiltersOnBranchChange?: boolean;

  // Seguridad y permisos
  requireConfirmationOnDelete?: boolean;
  requireConfirmationOnBulkDelete?: boolean;

  // Carrito de compras (específico de productos)
  autoCloseModalOnAddToCart?: boolean;
  showSuccessToastOnAddToCart?: boolean;
  allowAddToCartFromModal?: boolean;

  // Modal de producto
  productModalSize?: 'small' | 'medium' | 'large';
  showRelatedProducts?: boolean;
  showPriceHistory?: boolean;

  // Stock
  stockLowThreshold?: number;
  stockCriticalThreshold?: number;
  highlightLowStock?: boolean;

  // Imágenes
  imageModalSize?: 'small' | 'medium' | 'large';
  enableImageZoom?: boolean;
  showImagePlaceholder?: boolean;

  // Navegación
  enableKeyboardShortcuts?: boolean;
  focusTableOnMount?: boolean;

  // Filtros (de búsqueda, no de tabla)
  showFiltersOnMount?: boolean;
  collapseFiltersOnMobile?: boolean;

  // Scroll infinito
  infiniteScrollThreshold?: number;
  infiniteScrollBatchSize?: number;

  // Exportación
  exportFormat?: 'xlsx' | 'csv' | 'pdf';
  exportFileName?: string;
  includeHiddenColumns?: boolean;

  // Extensible para comportamientos personalizados
  [key: string]: any;
}

export interface ViewConfiguration {
  id: string;
  name: string;
  module?: string;
  path?: string;
  features?: ViewFeaturesConfig;
  behaviors?: ViewBehaviorsConfig;
  table?: TableConfig;
}

export type ConfigLevel = 'base' | 'organization' | 'user';

export interface MergedViewConfig extends ViewConfiguration {
  _sources?: {
    features?: Record<string, ConfigLevel>;
    behaviors?: Record<string, ConfigLevel>;
    table?: ConfigLevel; // Fuente de la config de tabla
  };
}