import type { ViewConfiguration } from '@/config/viewConfigTypes';
import { STORAGE_KEYS } from '@/config/viewConfigTypes';
import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export function useRouteViewConfig(): ViewConfiguration | null {
  const location = useLocation();

  const config = useMemo(() => {
    const routeConfig = findRouteConfig(location.pathname, protectedRoutes);

    if (!routeConfig || !routeConfig.id) {
      return null;
    }

    const systemConfig = loadSystemConfig(routeConfig.id);

    const userConfig = loadUserConfig(routeConfig.id);

    const merged = mergeConfigs(routeConfig, systemConfig, userConfig);

    return merged;
  }, [location.pathname]);

  return config;
}

export function useUserViewConfig(viewId: string) {
  const getUserConfig = () => {
    return loadUserConfig(viewId);
  };

  const updateUserConfig = (updates: Partial<ViewConfiguration>) => {
    const current = loadUserConfig(viewId) || {};
    const updated = mergeConfigs(current, updates);
    saveUserConfig(viewId, updated);
  };

  const resetUserConfig = () => {
    deleteUserConfig(viewId);
  };

  return {
    getUserConfig,
    updateUserConfig,
    resetUserConfig,
  };
}

export function useSystemViewConfig(viewId: string) {
  const getSystemConfig = () => {
    return loadSystemConfig(viewId);
  };

  const updateSystemConfig = (updates: Partial<ViewConfiguration>) => {
    const current = loadSystemConfig(viewId) || {};
    const updated = mergeConfigs(current, updates);
    saveSystemConfig(viewId, updated);
  };

  const resetSystemConfig = () => {
    deleteSystemConfig(viewId);
  };

  return {
    getSystemConfig,
    updateSystemConfig,
    resetSystemConfig,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Cargar configuración de usuario desde localStorage
 */
function loadUserConfig(viewId: string): ViewConfiguration | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_VIEW_CONFIGS);
    if (!stored) return null;

    const allConfigs = JSON.parse(stored) as Record<string, ViewConfiguration>;
    return allConfigs[viewId] || null;
  } catch (error) {
    console.error('Error loading user config:', error);
    return null;
  }
}

/**
 * Guardar configuración de usuario en localStorage
 */
function saveUserConfig(viewId: string, config: ViewConfiguration): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_VIEW_CONFIGS);
    const allConfigs = stored ? JSON.parse(stored) : {};

    allConfigs[viewId] = config;

    localStorage.setItem(STORAGE_KEYS.USER_VIEW_CONFIGS, JSON.stringify(allConfigs));
  } catch (error) {
    console.error('Error saving user config:', error);
  }
}

/**
 * Eliminar configuración de usuario
 */
function deleteUserConfig(viewId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_VIEW_CONFIGS);
    if (!stored) return;

    const allConfigs = JSON.parse(stored);
    delete allConfigs[viewId];

    localStorage.setItem(STORAGE_KEYS.USER_VIEW_CONFIGS, JSON.stringify(allConfigs));
  } catch (error) {
    console.error('Error deleting user config:', error);
  }
}

/**
 * Cargar configuración global del sistema desde localStorage
 */
function loadSystemConfig(viewId: string): ViewConfiguration | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SYSTEM_VIEW_CONFIGS);
    if (!stored) return null;

    const allConfigs = JSON.parse(stored) as Record<string, ViewConfiguration>;
    return allConfigs[viewId] || null;
  } catch (error) {
    console.error('Error loading system config:', error);
    return null;
  }
}

/**
 * Guardar configuración global del sistema en localStorage
 */
function saveSystemConfig(viewId: string, config: ViewConfiguration): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SYSTEM_VIEW_CONFIGS);
    const allConfigs = stored ? JSON.parse(stored) : {};

    allConfigs[viewId] = config;

    localStorage.setItem(STORAGE_KEYS.SYSTEM_VIEW_CONFIGS, JSON.stringify(allConfigs));
  } catch (error) {
    console.error('Error saving system config:', error);
  }
}

/**
 * Eliminar configuración global del sistema
 */
function deleteSystemConfig(viewId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SYSTEM_VIEW_CONFIGS);
    if (!stored) return;

    const allConfigs = JSON.parse(stored);
    delete allConfigs[viewId];

    localStorage.setItem(STORAGE_KEYS.SYSTEM_VIEW_CONFIGS, JSON.stringify(allConfigs));
  } catch (error) {
    console.error('Error deleting system config:', error);
  }
}

/**
 * Merge múltiples configuraciones con deep merge
 * Cada configuración posterior sobrescribe la anterior
 */
function mergeConfigs(...configs: (ViewConfiguration | null | undefined)[]): ViewConfiguration {
  const result: ViewConfiguration = {
    features: {},
    behaviors: {},
  };

  for (const config of configs) {
    if (!config) continue;

    // Merge metadata
    if (config.id) result.id = config.id;
    if (config.name) result.name = config.name;
    if (config.module) result.module = config.module;
    if (config.path) result.path = config.path;

    // Merge features
    if (config.features) {
      result.features = {
        ...result.features,
        ...config.features,
      };
    }

    // Merge behaviors
    if (config.behaviors) {
      result.behaviors = {
        ...result.behaviors,
        ...config.behaviors,
      };
    }
  }

  return result;
}

/**
 * Buscar la configuración de una ruta basándose en el pathname
 */
function findRouteConfig(pathname: string, routes: RouteType[]): ViewConfiguration | null {
  for (const route of routes) {
    // Verificar si la ruta actual coincide
    if (route.path && matchPath(pathname, route.path)) {
      if (route.viewConfig) {
        return route.viewConfig;
      }
    }

    // Buscar en subrutas
    if (route.subRoutes) {
      const subRouteConfig = findRouteConfig(pathname, route.subRoutes);
      if (subRouteConfig) {
        return subRouteConfig;
      }
    }
  }

  return null;
}

/**
 * Función simple para verificar si un pathname coincide con un patrón de ruta
 */
function matchPath(pathname: string, pattern: string): boolean {
  // Convertir patrón de ruta a regex
  // Ej: "/dashboard/user/:nickname" -> /^\/dashboard\/user\/[^/]+$/
  const regexPattern = pattern
    .replace(/:[^/]+/g, '[^/]+') // :param -> cualquier cosa excepto /
    .replace(/\//g, '\\/'); // escapar /

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}
