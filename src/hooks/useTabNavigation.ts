import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useTabStore } from '@/states/tabStore';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router';


//Hook para manejar la navegación con el sistema de tabs

export const useTabNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  //Optimizado Selectores específicos en lugar de desestructurar todo
  const tabs = useTabStore(state => state.tabs);
  const activeTabId = useTabStore(state => state.activeTabId);
  const setActiveTab = useTabStore(state => state.setActiveTab);
  // removeTab, addTab, findTabByPath, updateTab se obtienen directamente del store donde se necesitan

  // Bandera para prevenir recreación de tabs después de cerrar
  const isClosingTabRef = useRef(false);

  // Cache de rutas aplanadas (se calcula una sola vez)
  const flatRoutes = useMemo(() => {
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
    return flatten(protectedRoutes);
  }, []);

  // Cache de rutas ya resueltas
  const routeInfoCache = useRef(new Map<string, { name: string; icon?: any }>());

  // Función para encontrar el nombre e icono de una ruta
  // Soporta rutas dinámicas y extrae parámetros para mostrar en el título
  const findRouteInfo = useCallback((path: string): { name: string; icon?: any } => {
    // Verificar cache primero
    if (routeInfoCache.current.has(path)) {
      return routeInfoCache.current.get(path)!;
    }

    // Buscar en rutas aplanadas (más eficiente)
    for (const route of flatRoutes) {
      // Intentar match exacto
      if (route.path === path) {
        const info = { name: route.name, icon: route.icon };
        routeInfoCache.current.set(path, info);
        return info;
      }

      // Intentar match con parámetros dinámicos usando matchPath correctamente
      if (route.path) {
        const match = matchPath({ path: route.path, end: true }, path);
        if (match) {
          // Si tiene parámetros, agregarlos al nombre del tab
          const params = match.params;
          const paramValues = Object.values(params).filter(Boolean);

          // Crear un nombre descriptivo con el parámetro
          const displayName = paramValues.length > 0
            ? `${route.name}: ${paramValues[0]}`
            : route.name;

          const info = { name: displayName, icon: route.icon };
          routeInfoCache.current.set(path, info);
          return info;
        }
      }
    }

    const fallback = { name: 'Sin título', icon: undefined };
    routeInfoCache.current.set(path, fallback);
    return fallback;
  }, [flatRoutes]);


  //Navegar a una ruta y crear/activar un tab

  const navigateWithTab = useCallback((path: string, options?: { newTab?: boolean; instanceId?: string }) => {
    const routeInfo = findRouteInfo(path);
    const state = useTabStore.getState();
    const instanceId = options?.instanceId;
    const existingTab = state.findTabByPath(path, instanceId);

    if (options?.newTab || !existingTab) {
      // Crear nuevo tab con instanceId opcional
      const tabId = state.addTab(path, routeInfo.name, routeInfo.icon, instanceId);
      state.setActiveTab(tabId);
    } else {
      // Activar tab existente
      state.setActiveTab(existingTab.id);
    }

    navigate(path);
  }, [navigate, findRouteInfo]);

  
  //Navegar al siguiente tab
  
  const nextTab = useCallback(() => {
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextTab = tabs[nextIndex];

    if (nextTab) {
      setActiveTab(nextTab.id);
      navigate(nextTab.path);
    }
  }, [tabs, activeTabId, setActiveTab, navigate]);

  
  //Navegar al tab anterior
  
  const previousTab = useCallback(() => {
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    const prevTab = tabs[prevIndex];

    if (prevTab) {
      setActiveTab(prevTab.id);
      navigate(prevTab.path);
    }
  }, [tabs, activeTabId, setActiveTab, navigate]);


  //Cerrar tab actual o una tab específica

  const closeCurrentTab = useCallback((tabIdToClose?: string) => {
    // ✅ FIX: Obtener estado fresco directamente del store
    const state = useTabStore.getState();
    const targetTabId = tabIdToClose || state.activeTabId;

    // No permitir cerrar si solo hay 1 tab
    if (state.tabs.length <= 1) {
      return;
    }

    if (!targetTabId) {
      return;
    }

    // Activar bandera para prevenir recreación de tab
    isClosingTabRef.current = true;

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
      isClosingTabRef.current = false;
    });
  }, [navigate]);


  //Migrar tabs antiguos y recuperar iconos desde localStorage (solo una vez al montar)
  const hasMigratedRef = useRef(false);

  useEffect(() => {
    // Solo ejecutar una vez al montar
    if (hasMigratedRef.current) return;
    hasMigratedRef.current = true;

    // Agrupar todas las actualizaciones en un solo batch
    const tabsToUpdate = tabs.filter(tab =>
      tab.title === tab.path ||
      tab.title.startsWith('/') ||
      !tab.icon
    );

    if (tabsToUpdate.length > 0) {
      const state = useTabStore.getState();
      tabsToUpdate.forEach(tab => {
        const routeInfo = findRouteInfo(tab.path);
        state.updateTab(tab.id, {
          title: routeInfo.name,
          icon: routeInfo.icon
        });
      });
    }
  }, []);


  // Optimizado Si navegamos sin usar navigateWithTab, esto crea/activa el tab automáticamente
  // Reducción de dependencias para evitar ejecuciones innecesarias
  useEffect(() => {
    const currentPath = location.pathname;

    // Ignorar rutas públicas
    if (currentPath === '/' || currentPath.startsWith('/auth')) {
      return;
    }

    // Si estamos cerrando una tab, no crear tabs nuevas
    if (isClosingTabRef.current) {
      return;
    }

    // Obtener estado fresco directamente del store para evitar dependencias
    const state = useTabStore.getState();
    // Para navegación automática, buscar sin instanceId (undefined)
    const existingTab = state.findTabByPath(currentPath, undefined);

    if (!existingTab) {
      // Crear tab automáticamente si no existe (sin instanceId)
      const routeInfo = findRouteInfo(currentPath);
      const tabId = state.addTab(currentPath, routeInfo.name, routeInfo.icon, undefined);
      state.setActiveTab(tabId);
    } else {
      // Verificar si el tab necesita actualización de título
      const routeInfo = findRouteInfo(currentPath);
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
    // Solo depende de location.pathname y findRouteInfo
  }, [location.pathname, findRouteInfo]);

  return {
    navigateWithTab,
    nextTab,
    previousTab,
    closeCurrentTab,
    currentTab: tabs.find(tab => tab.id === activeTabId),
    tabs,
  };
};
