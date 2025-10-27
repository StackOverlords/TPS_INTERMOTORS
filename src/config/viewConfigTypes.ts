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

  permissions?: ViewFeatureConfig;
  saveButton?: ViewFeatureConfig;
}

// ====================================
// Behavior Configurations
// ====================================

export interface ViewBehaviorsConfig {
  // Modos de interacción
  productSelectorMode?: 'embedded' | 'modal' | 'window';
  openDetailsIn?: 'same-page' | 'new-tab' | 'modal' | 'window';

  // Persistencia
  persistFilters?: boolean;
  persistColumnOrder?: boolean;
  persistColumnVisibility?: boolean;
  persistColumnSizes?: boolean;

  // Defaults
  defaultRowsPerPage?: number;
  defaultSearchMode?: 'realtime' | 'manual';
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';

  // Seguridad y permisos
  requireConfirmationOnDelete?: boolean;
  allowBulkActions?: boolean;
}

// =============================================================================
// Complete View Configuration
// =============================================================================

export interface ViewConfiguration {
  id?: string;
  name?: string;
  module?: string;
  path?: string;

  features?: ViewFeaturesConfig;
  behaviors?: ViewBehaviorsConfig;
}

// ====================================
// Configuration Storage Keys
// ====================================
// Aqui agregaremos las claves, luego podriamos trabajar con el .env
// No olvidaar
export const STORAGE_KEYS = {
  USER_VIEW_CONFIGS: 'user-view-configs',
  SYSTEM_VIEW_CONFIGS: 'system-view-configs',
} as const;

// =============================================================================
// Configuration Levels
// =============================================================================
export type ConfigLevel = 'route' | 'system' | 'user';

export interface ConfigSource {
  level: ConfigLevel;
  config: ViewConfiguration;
}
