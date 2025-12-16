import type { 
  MergedViewConfig, 
  ViewConfiguration,
  TableState,
  TableBehaviorsConfig 
} from "@/view-configs/viewConfigTypes";

/**
 * Mergea configuraciones de múltiples niveles (base, organización, usuario)
 * Prioridad: Usuario > Organización > Base
 */
export function mergeViewConfigs(
  base?: ViewConfiguration,
  organization?: Partial<ViewConfiguration>,
  user?: Partial<ViewConfiguration>
): MergedViewConfig {
  const merged: MergedViewConfig = {
    id: base?.id || '',
    name: base?.name || '',
    module: base?.module,
    path: base?.path,
    features: {},
    behaviors: {},
    table: {
      behaviors: {},
      state: {},
    },
    _sources: {
      features: {},
      behaviors: {},
    },
  };

  // Merge features
  const allFeatureKeys = new Set<string>([
    ...Object.keys(base?.features || {}),
    ...Object.keys(organization?.features || {}),
    ...Object.keys(user?.features || {}),
  ]);

  for (const key of allFeatureKeys) {
    const baseFeature = base?.features?.[key];
    const orgFeature = organization?.features?.[key];
    const userFeature = user?.features?.[key];

    if (userFeature !== undefined) {
      merged.features![key] = { ...baseFeature, ...orgFeature, ...userFeature };
      merged._sources!.features![key] = 'user';
    } else if (orgFeature !== undefined) {
      merged.features![key] = { ...baseFeature, ...orgFeature };
      merged._sources!.features![key] = 'organization';
    } else if (baseFeature !== undefined) {
      merged.features![key] = baseFeature;
      merged._sources!.features![key] = 'base';
    }
  }

  // Merge behaviors (NO incluye behaviors de tabla)
  const allBehaviorKeys = new Set<string>([
    ...Object.keys(base?.behaviors || {}),
    ...Object.keys(organization?.behaviors || {}),
    ...Object.keys(user?.behaviors || {}),
  ]);

  for (const key of allBehaviorKeys) {
    const baseBehavior = base?.behaviors?.[key];
    const orgBehavior = organization?.behaviors?.[key];
    const userBehavior = user?.behaviors?.[key];

    if (userBehavior !== undefined) {
      merged.behaviors![key] = userBehavior;
      merged._sources!.behaviors![key] = 'user';
    } else if (orgBehavior !== undefined) {
      merged.behaviors![key] = orgBehavior;
      merged._sources!.behaviors![key] = 'organization';
    } else if (baseBehavior !== undefined) {
      merged.behaviors![key] = baseBehavior;
      merged._sources!.behaviors![key] = 'base';
    }
  }

  // ✅ Merge table.behaviors (configuración de cómo funciona la tabla)
  // Los behaviors se mergean (el nivel superior sobrescribe al inferior)
  const baseTableBehaviors = base?.table?.behaviors || {};
  const orgTableBehaviors = organization?.table?.behaviors || {};
  const userTableBehaviors = user?.table?.behaviors || {};

  merged.table!.behaviors = {
    ...baseTableBehaviors,
    ...orgTableBehaviors,
    ...userTableBehaviors,
  };

  // ✅ Merge table.state (el estado actual se toma del nivel más alto que lo tenga)
  // El estado NO se mergea, se toma completo del nivel más alto
  if (user?.table?.state) {
    merged.table!.state = user.table.state;
    merged._sources!.table = 'user';
  } else if (organization?.table?.state) {
    merged.table!.state = organization.table.state;
    merged._sources!.table = 'organization';
  } else if (base?.table?.state) {
    merged.table!.state = base.table.state;
    merged._sources!.table = 'base';
  }

  return merged;
}

/**
 * Verifica si un feature está habilitado
 */
export function isFeatureEnabled(
  config: ViewConfiguration | undefined,
  featureName: string
): boolean {
  return config?.features?.[featureName]?.enabled ?? false;
}

/**
 * Obtiene el valor de un behavior general (no de tabla)
 */
export function getBehaviorValue<T = any>(
  config: ViewConfiguration | undefined,
  behaviorName: string
): T | undefined {
  return config?.behaviors?.[behaviorName] as T | undefined;
}

/**
 * Obtiene todos los behaviors de la tabla
 */
export function getTableBehaviors(
  config: ViewConfiguration | undefined
): TableBehaviorsConfig {
  return config?.table?.behaviors || {};
}

/**
 * Obtiene el estado completo de la tabla
 */
export function getTableState(
  config: ViewConfiguration | undefined
): TableState | undefined {
  return config?.table?.state;
}

/**
 * Verifica si una propiedad del tableState debe persistirse según table.behaviors
 */
export function shouldPersistTableProperty(
  config: ViewConfiguration | undefined,
  property: keyof TableState
): boolean {
  const behaviors = config?.table?.behaviors;
  
  switch (property) {
    case 'columnVisibility':
      return behaviors?.persistColumnVisibility ?? true;
    case 'columnOrder':
      return behaviors?.persistColumnOrder ?? true;
    case 'columnSizes':
      return behaviors?.persistColumnSizes ?? true;
    case 'pagination':
      return behaviors?.persistPagination ?? true;
    case 'sorting':
      return behaviors?.persistSorting ?? true;
    case 'filters':
      return behaviors?.persistFilters ?? false;
    default:
      return false;
  }
}

/**
 * Obtiene un valor específico de table.behaviors
 */
export function getTableBehaviorValue<T = any>(
  config: ViewConfiguration | undefined,
  behaviorName: keyof TableBehaviorsConfig
): T | undefined {
  return config?.table?.behaviors?.[behaviorName] as T | undefined;
}