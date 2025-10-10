import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useTabStore } from '@/states/tabStore';
import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';


//Hook para manejar la navegación con el sistema de tabs

export const useTabNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTab, setActiveTab, findTabByPath, activeTabId, tabs, removeTab } = useTabStore();

  // Función para encontrar el nombre e icono de una ruta
  const findRouteInfo = useCallback((path: string): { name: string; icon?: any } => {
    const findInRoutes = (routes: RouteType[], targetPath: string): { name: string; icon?: any } | null => {
      for (const route of routes) {
        if (route.path === targetPath) {
          return { name: route.name, icon: route.icon };
        }
        if (route.subRoutes) {
          const found = findInRoutes(route.subRoutes, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const info = findInRoutes(protectedRoutes, path);
    return info || { name: path.split('/').pop() || 'Sin título', icon: undefined };
  }, []);

  
  //Navegar a una ruta y crear/activar un tab
  
  const navigateWithTab = useCallback((path: string, options?: { newTab?: boolean }) => {
    const routeInfo = findRouteInfo(path);
    const existingTab = findTabByPath(path);

    if (options?.newTab || !existingTab) {
      // Crear nuevo tab
      const tabId = addTab(path, routeInfo.name, routeInfo.icon);
      setActiveTab(tabId);
    } else {
      // Activar tab existente
      setActiveTab(existingTab.id);
    }

    navigate(path);
  }, [addTab, setActiveTab, findTabByPath, navigate, findRouteInfo]);

  
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

  
  //Cerrar tab actual
  
  const closeCurrentTab = useCallback(() => {
    if (activeTabId) {
      removeTab(activeTabId);
    }
  }, [activeTabId, removeTab]);

  
  //Sincronizar la ruta actual con el sistema de tabs
  //Si navegamos sin usar navigateWithTab, esto crea/activa el tab automáticamente
  useEffect(() => {
    const currentPath = location.pathname;

    // Ignorar rutas públicas
    if (currentPath === '/' || currentPath.startsWith('/auth')) {
      return;
    }

    const existingTab = findTabByPath(currentPath);

    if (!existingTab) {
      // Crear tab automáticamente si no existe
      const routeInfo = findRouteInfo(currentPath);
      const tabId = addTab(currentPath, routeInfo.name, routeInfo.icon);
      setActiveTab(tabId);
    } else if (existingTab.id !== activeTabId) {
      // Activar el tab si ya existe pero no está activo
      setActiveTab(existingTab.id);
    }
  }, [location.pathname, findTabByPath, addTab, setActiveTab, activeTabId, findRouteInfo]);

  return {
    navigateWithTab,
    nextTab,
    previousTab,
    closeCurrentTab,
    currentTab: tabs.find(tab => tab.id === activeTabId),
    tabs,
  };
};
