import type { ViewConfiguration } from '@/config/viewConfigTypes';
import { STORAGE_KEYS } from '@/config/viewConfigTypes';
import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// =============================================================================
// Types
// =============================================================================

interface CacheEntry {
  data: Record<string, ViewConfiguration>;
  timestamp: number;
}

// =============================================================================
// Cache Global para Optimizar Lecturas
// =============================================================================

const configCache = new Map<string, CacheEntry>();
const CACHE_TTL = 100; // 100ms de validez del cache

// =============================================================================
// Helper Functions - Emisión de Eventos
// =============================================================================

/**
 * Throttle para evitar spam de eventos
 */
const emitThrottled = (() => {
  let lastEmit = 0;
  const THROTTLE_MS = 100;

  return (viewId: string) => {
    const now = Date.now();
    if (now - lastEmit < THROTTLE_MS) {
      console.log(`[emitThrottled] Throttled para viewId="${viewId}"`);
      return;
    }

    lastEmit = now;

    console.log(`[emitThrottled] Emitiendo eventos para viewId="${viewId}"`);

    // Emitir evento custom para la misma ventana (actualización inmediata)
    window.dispatchEvent(
      new CustomEvent('local-view-config:updated', {
        detail: { viewId },
      })
    );
    console.log(`[emitThrottled] ✅ Custom event emitido`);

    // Emitir evento Tauri para otras ventanas (async, no bloqueante)
    if ((window as any).__TAURI__) {
      import('@tauri-apps/api/event')
        .then(({ emit }) => {
          emit('view-config:updated', { viewId, timestamp: now });
          console.log(`[emitThrottled] ✅ Tauri event emitido`);
        })
        .catch(err => {
          console.error('[emitThrottled] Error emitting Tauri event:', err);
        });
    }
  };
})();

// =============================================================================
// Helper Functions - Cargar/Guardar Configuraciones
// =============================================================================

/**
 * Cargar configuración de usuario desde localStorage (SIN cache)
 * @deprecated Usar loadUserConfigCached para mejor rendimiento
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
 * Cargar configuración de usuario con cache optimizado
 * Reduce llamadas a JSON.parse en ~95%
 */
function loadUserConfigCached(viewId: string): ViewConfiguration | null {
  const cached = configCache.get(STORAGE_KEYS.USER_VIEW_CONFIGS);
  const now = Date.now();

  // Si el cache es válido, usarlo
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data[viewId] || null;
  }

  // Si no, leer de localStorage y cachear
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_VIEW_CONFIGS);
    if (!stored) return null;

    const allConfigs = JSON.parse(stored) as Record<string, ViewConfiguration>;

    // Guardar en cache
    configCache.set(STORAGE_KEYS.USER_VIEW_CONFIGS, {
      data: allConfigs,
      timestamp: now,
    });

    return allConfigs[viewId] || null;
  } catch (error) {
    console.error('Error loading user config:', error);
    return null;
  }
}

/**
 * Guardar configuración de usuario en localStorage + emitir eventos
 */
function saveUserConfig(viewId: string, config: ViewConfiguration): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_VIEW_CONFIGS);
    const allConfigs = stored ? JSON.parse(stored) : {};

    allConfigs[viewId] = config;

    localStorage.setItem(
      STORAGE_KEYS.USER_VIEW_CONFIGS,
      JSON.stringify(allConfigs)
    );

    // Invalidar cache
    configCache.delete(STORAGE_KEYS.USER_VIEW_CONFIGS);

    console.log(`[saveUserConfig] Guardado viewId="${viewId}", emitiendo eventos...`);

    // Emitir eventos (throttled)
    emitThrottled(viewId);
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

    localStorage.setItem(
      STORAGE_KEYS.USER_VIEW_CONFIGS,
      JSON.stringify(allConfigs)
    );

    // Invalidar cache
    configCache.delete(STORAGE_KEYS.USER_VIEW_CONFIGS);

    // Emitir eventos
    emitThrottled(viewId);
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

    const allConfigs = JSON.parse(stored) as Record<
      string,
      ViewConfiguration
    >;
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

    localStorage.setItem(
      STORAGE_KEYS.SYSTEM_VIEW_CONFIGS,
      JSON.stringify(allConfigs)
    );
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

    localStorage.setItem(
      STORAGE_KEYS.SYSTEM_VIEW_CONFIGS,
      JSON.stringify(allConfigs)
    );
  } catch (error) {
    console.error('Error deleting system config:', error);
  }
}

/**
 * Merge múltiples configuraciones con deep merge
 * Cada configuración posterior sobrescribe la anterior
 */
function mergeConfigs(
  ...configs: (ViewConfiguration | null | undefined)[]
): ViewConfiguration {
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
function findRouteConfig(
  pathname: string,
  routes: RouteType[]
): ViewConfiguration | null {
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

// =============================================================================
// Hooks Públicos
// =============================================================================

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

/**
 * Hook que combina configuración de ruta + sincronización en tiempo real
 * Reemplaza el uso de useRouteViewConfig + useViewConfigSync + useMemo manual
 *
 * @returns ViewConfiguration con actualizaciones en tiempo real
 */
export function useRouteViewConfigWithSync(): ViewConfiguration | null {
  const location = useLocation();

  
  // Obtener configuración base (ruta + sistema)
  const baseConfig = useMemo(() => {
    const routeConfig = findRouteConfig(location.pathname, protectedRoutes);

    if (!routeConfig || !routeConfig.id) {
      return null;
    }

    const systemConfig = loadSystemConfig(routeConfig.id);

    // Merge ruta + sistema (sin user config todavía)
    return mergeConfigs(routeConfig, systemConfig);
  }, [location.pathname]);

  // Configuración de usuario en tiempo real
  const userConfig = useViewConfigSync(baseConfig?.id || '');

  // Merge final: base + user (con tiempo real)
  const finalConfig = useMemo(() => {
    if (!baseConfig) return null;
    return mergeConfigs(baseConfig, userConfig);
  }, [baseConfig, userConfig]);

  return finalConfig;
}

export function useUserViewConfig(viewId: string) {
  const getUserConfig = useCallback(() => {
    return loadUserConfigCached(viewId);
  }, [viewId]);

  const updateUserConfig = useCallback(
    (updates: Partial<ViewConfiguration>) => {
      const current = loadUserConfigCached(viewId) || {};
      const updated = mergeConfigs(current, updates);
      saveUserConfig(viewId, updated);
    },
    [viewId]
  );

  const resetUserConfig = useCallback(() => {
    deleteUserConfig(viewId);
  }, [viewId]);

  return {
    getUserConfig,
    updateUserConfig,
    resetUserConfig,
  };
}

/**
 * Hook para sincronizar configuraciones entre ventanas en tiempo real
 * Combina Storage Events (tabs) + Tauri Events (ventanas secundarias)
 */
export function useViewConfigSync(viewId: string) {
  const [config, setConfig] = useState<ViewConfiguration | null>(() =>
    loadUserConfigCached(viewId)
  );
  const reloadTimeoutRef = useRef<number | undefined>(undefined);

  const reloadConfig = useCallback(() => {
    // Invalidar cache
    configCache.delete(STORAGE_KEYS.USER_VIEW_CONFIGS);

    // Debounce: esperar 50ms antes de recargar
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = window.setTimeout(() => {
      const newConfig = loadUserConfigCached(viewId);
      setConfig(newConfig);
    }, 50);
  }, [viewId]);

  useEffect(() => {
    // 1. Storage events (otras tabs del navegador)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USER_VIEW_CONFIGS) {
        reloadConfig();
      }
    };

    // 2. Custom events (misma ventana - para actualización inmediata)
    const handleLocalChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log(`[useViewConfigSync] Custom event recibido:`, customEvent.detail);
      if (customEvent.detail?.viewId === viewId) {
        console.log(`[useViewConfigSync] ✅ Recargando config para viewId="${viewId}"`);
        reloadConfig();
      } else {
        console.log(`[useViewConfigSync] ❌ ViewId no coincide. Esperado="${viewId}", Recibido="${customEvent.detail?.viewId}"`);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-view-config:updated', handleLocalChange);

    // 3. Tauri events (ventanas secundarias)
    let unlistenTauri: (() => void) | null = null;

    if ((window as any).__TAURI__) {
      import('@tauri-apps/api/event')
        .then(({ listen }) => {
          listen('view-config:updated', (event: any) => {
            if (event.payload.viewId === viewId) {
              reloadConfig();
            }
          })
            .then(unlisten => {
              unlistenTauri = unlisten;
            })
            .catch(err => {
              console.error(
                '[useViewConfigSync] Error setting up Tauri listener:',
                err
              );
            });
        })
        .catch(err => {
          console.error('[useViewConfigSync] Tauri not available:', err);
        });
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-view-config:updated', handleLocalChange);
      unlistenTauri?.();
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, [viewId, reloadConfig]);

  return config;
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
