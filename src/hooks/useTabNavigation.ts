import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useTabStore } from '@/states/tabStore';
import { useUserRole } from '@/hooks/useUserRole';
import { hasRouteAccess } from '@/utils/permissions';
import { RouteRegistry, useRegistryRoutes } from '@/plugins';
import type { RouteConfig } from '@tps/plugin-sdk';
import { useCallback, useEffect, useRef } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router';

// =============================================================================
// Resolución de rutas (estáticas + plugin), sin suscripciones de React
// =============================================================================

type RouteInfo = { name: string; icon?: any };

let flatCache: { plugins: RouteConfig[]; routes: RouteType[] } | undefined;
const routeInfoCache = new Map<string, RouteInfo>();

const flatten = (routes: RouteType[]): RouteType[] => {
  const result: RouteType[] = [];
  routes.forEach(route => {
    if (route.path) {
      result.push(route);
    }
    if (route.subRoutes) {
      result.push(...flatten(route.subRoutes));
    }
  });
  return result;
};

/**
 * Rutas aplanadas (estáticas + plugin). Se recalcula solo cuando el
 * RouteRegistry cambia: `getAllRoutes()` devuelve la misma referencia mientras
 * ningún plugin registre o des-registre rutas.
 */
function getFlatRoutes(): RouteType[] {
  const plugins = RouteRegistry.getAllRoutes();
  if (flatCache?.plugins !== plugins) {
    // Adaptar RouteConfig (SDK) → RouteType para que findRouteInfo/findRouteByPath
    // resuelvan nombre, icono y permisos de las rutas de plugin igual que las estáticas.
    const pluginAsRouteType: RouteType[] = plugins.map(rc => ({
      path: rc.path,
      element: rc.component,
      name: rc.label,
      type: 'protected' as const,
      icon: rc.icon,
      role: rc.roles as RouteType['role'],
    }));
    flatCache = { plugins, routes: [...flatten(protectedRoutes), ...pluginAsRouteType] };
    // Una ruta de plugin nueva puede cambiar lo que resuelve un path ya cacheado.
    routeInfoCache.clear();
  }
  return flatCache.routes;
}

// Función para encontrar el nombre e icono de una ruta
// Soporta rutas dinámicas y extrae parámetros para mostrar en el título
function findRouteInfo(path: string, displayCode?: string): RouteInfo {
  const flatRoutes = getFlatRoutes();

  // Verificar cache primero (solo si no hay displayCode custom)
  if (!displayCode && routeInfoCache.has(path)) {
    return routeInfoCache.get(path)!;
  }

  for (const route of flatRoutes) {
    // Intentar match exacto
    if (route.path === path) {
      const info = { name: route.name, icon: route.icon };
      if (!displayCode) routeInfoCache.set(path, info);
      return info;
    }

    // Intentar match con parámetros dinámicos usando matchPath correctamente
    if (route.path) {
      const match = matchPath({ path: route.path, end: true }, path);
      if (match) {
        // Si tiene parámetros, agregarlos al nombre del tab
        const paramValues = Object.values(match.params).filter(Boolean);

        // Usar displayCode si existe, sino usar parámetro extraído
        const displayValue = displayCode || paramValues[0];

        // Crear un nombre descriptivo con el parámetro
        const displayName = displayValue
          ? `${route.name}: ${displayValue}`
          : route.name;

        const info = { name: displayName, icon: route.icon };
        if (!displayCode) routeInfoCache.set(path, info);
        return info;
      }
    }
  }

  const fallback = { name: 'Sin título', icon: undefined };
  if (!displayCode) routeInfoCache.set(path, fallback);
  return fallback;
}

// Busca la ruta completa (con roles) para verificar permisos
function findRouteByPath(path: string): RouteType | undefined {
  for (const route of getFlatRoutes()) {
    if (route.path === path) return route;
    if (route.path) {
      const match = matchPath({ path: route.path, end: true }, path);
      if (match) return route;
    }
  }
  return undefined;
}

// Bandera para prevenir recreación de tabs después de cerrar. Es global (no
// por instancia del hook) porque quien cierra y quien sincroniza la ruta con
// las tabs pueden ser componentes distintos.
let isClosingTab = false;

// =============================================================================
// Hooks
// =============================================================================

/**
 * Acciones de navegación con tabs.
 *
 * No se suscribe a la lista de tabs ni a la tab activa: lee el store en el
 * momento de la acción. Las pantallas que solo necesitan `navigateWithTab`
 * deben usar este hook; así no se re-renderizan cada vez que se abre, cierra
 * o cambia una tab (antes, cada tabla montada en segundo plano se volvía a
 * renderizar en cada cambio de pestaña).
 */
export const useTabActions = () => {
  const navigate = useNavigate();

  //Navegar a una ruta y crear/activar un tab
  const navigateWithTab = useCallback((path: string, options?: { newTab?: boolean; instanceId?: string; displayCode?: string; replace?: boolean }) => {
    const state = useTabStore.getState();
    const instanceId = options?.instanceId;
    const existingTab = state.findTabByPath(path, instanceId);

    // Preparar metadata con displayCode si se provee
    const metadata = options?.displayCode
      ? { displayCode: options.displayCode }
      : undefined;

    if (options?.newTab || !existingTab) {
      // Generar título usando displayCode si está disponible
      const routeInfo = findRouteInfo(path);
      const title = options?.displayCode
        ? routeInfo.name.replace(/: .+$/, `: ${options.displayCode}`)
        : routeInfo.name;

      const tabId = state.addTab(path, title, routeInfo.icon, instanceId, metadata);

      // Anotar con routeId si el path corresponde a una ruta de plugin registrada.
      // Las tabs estáticas nativas no están en el RouteRegistry → routeId queda undefined.
      const pluginRoute = RouteRegistry.getRouteByPath(path);
      if (pluginRoute) {
        state.updateTab(tabId, { routeId: pluginRoute.id });
      }

      state.setActiveTab(tabId);
    } else {
      // Tab existe - actualizar metadata si se provee displayCode
      if (metadata) {
        state.updateTab(existingTab.id, {
          metadata: { ...existingTab.metadata, ...metadata },
          title: existingTab.title.replace(/: .+$/, `: ${options?.displayCode}`)
        });
      }
      state.setActiveTab(existingTab.id);
    }

    navigate(path, { replace: options?.replace });
  }, [navigate]);

  //Navegar al siguiente tab
  const nextTab = useCallback(() => {
    const { tabs, activeTabId, setActiveTab } = useTabStore.getState();
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextTab = tabs[nextIndex];

    if (nextTab) {
      setActiveTab(nextTab.id);
      navigate(nextTab.path);
    }
  }, [navigate]);

  //Navegar al tab anterior
  const previousTab = useCallback(() => {
    const { tabs, activeTabId, setActiveTab } = useTabStore.getState();
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    const prevTab = tabs[prevIndex];

    if (prevTab) {
      setActiveTab(prevTab.id);
      navigate(prevTab.path);
    }
  }, [navigate]);

  //Cerrar tab actual o una tab específica
  const closeCurrentTab = useCallback((tabIdToClose?: string) => {
    // Obtener estado fresco directamente del store
    const state = useTabStore.getState();
    const targetTabId = tabIdToClose || state.activeTabId;

    // No permitir cerrar si solo hay 1 tab
    if (state.tabs.length <= 1) {
      return;
    }

    if (!targetTabId) {
      return;
    }

    // No permitir cerrar tabs pinneadas
    const targetTab = state.tabs.find(tab => tab.id === targetTabId);
    if (targetTab?.pinned) {
      return;
    }

    // Activar bandera para prevenir recreación de tab
    isClosingTab = true;

    // Remover la tab actual o específica
    // IMPORTANTE: removeTab actualiza automáticamente el activeTabId al siguiente tab disponible
    state.removeTab(targetTabId);

    // Obtener el estado actualizado después de remover
    const updatedState = useTabStore.getState();
    const newActiveTab = updatedState.tabs.find(tab => tab.id === updatedState.activeTabId);

    if (newActiveTab) {
      navigate(newActiveTab.path);
    } else if (updatedState.tabs.length > 0) {
      // Fallback: navegar a la primera tab disponible
      navigate(updatedState.tabs[0].path);
    } else {
      // No quedan tabs, navegar al dashboard
      navigate('/dashboard');
    }

    // Desactivar bandera en el siguiente tick (mínimo delay necesario)
    requestAnimationFrame(() => {
      isClosingTab = false;
    });
  }, [navigate]);

  return { navigateWithTab, nextTab, previousTab, closeCurrentTab };
};

/**
 * Sincroniza la URL con las tabs: si se navega sin `navigateWithTab`, crea o
 * activa la tab correspondiente. Debe montarse UNA sola vez (lo hace el
 * TitleBar); antes corría una vez por cada pantalla que usaba el hook.
 */
export const useTabRouteSync = () => {
  const location = useLocation();

  // Rol del usuario para verificar permisos antes de crear tabs
  const { rol: userRole } = useUserRole();

  // Rutas aportadas por plugins: re-sincronizar cuando un plugin registra
  // rutas (p. ej. una tab de plugin restaurada antes de que el plugin cargue).
  const registryRoutes = useRegistryRoutes();

  //Migrar tabs antiguos y recuperar iconos (solo una vez al montar)
  const hasMigratedRef = useRef(false);

  useEffect(() => {
    if (hasMigratedRef.current) return;
    hasMigratedRef.current = true;

    const state = useTabStore.getState();
    const tabsToUpdate = state.tabs.filter(tab =>
      tab.title === tab.path ||
      tab.title.startsWith('/') ||
      !tab.icon
    );

    tabsToUpdate.forEach(tab => {
      const routeInfo = findRouteInfo(tab.path);
      state.updateTab(tab.id, {
        title: routeInfo.name,
        icon: routeInfo.icon
      });
    });
  }, []);

  // Si navegamos sin usar navigateWithTab, esto crea/activa el tab automáticamente
  useEffect(() => {
    const currentPath = location.pathname;

    // Ignorar rutas públicas
    if (currentPath === '/' || currentPath.startsWith('/auth')) {
      return;
    }

    // Si estamos cerrando una tab, no crear tabs nuevas
    if (isClosingTab) {
      return;
    }

    // Obtener estado fresco directamente del store para evitar dependencias
    const state = useTabStore.getState();
    // Para navegación automática, buscar sin instanceId (undefined)
    const existingTab = state.findTabByPath(currentPath, undefined);

    if (!existingTab) {
      // Verificar permisos antes de crear tab automáticamente
      // Si el usuario no tiene acceso, no crear el tab (RouteRenderer se encargará del redirect)
      const matchedRoute = findRouteByPath(currentPath);
      if (matchedRoute && !hasRouteAccess(matchedRoute, userRole)) {
        return;
      }

      // Crear tab automáticamente si no existe (sin instanceId)
      const routeInfo = findRouteInfo(currentPath);
      const tabId = state.addTab(currentPath, routeInfo.name, routeInfo.icon, undefined);

      // Anotar con routeId si el path corresponde a una ruta de plugin registrada.
      // Las tabs estáticas nativas no están en el RouteRegistry → routeId queda undefined.
      const pluginRoute = RouteRegistry.getRouteByPath(currentPath);
      if (pluginRoute) {
        state.updateTab(tabId, { routeId: pluginRoute.id });
      }

      state.setActiveTab(tabId);
    } else {
      // Respetar displayCode existente en metadata
      const displayCode = existingTab.metadata?.displayCode;
      const routeInfo = findRouteInfo(currentPath, displayCode);

      const needsUpdate =
        existingTab.title !== routeInfo.name ||
        existingTab.icon !== routeInfo.icon ||
        existingTab.title === existingTab.path || // Tab antiguo con path como título
        existingTab.title.startsWith('/'); // Título que parece un path

      if (needsUpdate) {
        // Actualizar el tab con el título correcto
        state.updateTab(existingTab.id, {
          title: routeInfo.name,
          icon: routeInfo.icon
        });
      }

      if (existingTab.id !== state.activeTabId) {
        // Activar el tab si ya existe pero no está activo
        state.setActiveTab(existingTab.id);
      }
    }
  }, [location.pathname, userRole, registryRoutes]);
};

/**
 * API completa (compatibilidad): sincronización + acciones + estado de tabs.
 * Se re-renderiza con cada cambio de tabs; en pantallas usar `useTabActions`.
 */
export const useTabNavigation = () => {
  useTabRouteSync();
  const actions = useTabActions();
  const tabs = useTabStore(state => state.tabs);
  const activeTabId = useTabStore(state => state.activeTabId);

  return {
    ...actions,
    currentTab: tabs.find(tab => tab.id === activeTabId),
    tabs,
  };
};
