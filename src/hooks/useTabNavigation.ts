import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useTabStore } from '@/states/tabStore';
import { useCallback, useEffect, useRef } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router';


//Hook para manejar la navegación con el sistema de tabs

export const useTabNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTab, setActiveTab, findTabByPath, activeTabId, tabs, removeTab, updateTab } = useTabStore();

  // Bandera para prevenir recreación de tabs después de cerrar
  const isClosingTabRef = useRef(false);

  // Función para encontrar el nombre e icono de una ruta
  // Soporta rutas dinámicas y extrae parámetros para mostrar en el título
  const findRouteInfo = useCallback((path: string): { name: string; icon?: any } => {
    const findInRoutes = (routes: RouteType[], targetPath: string): { name: string; icon?: any } | null => {
      for (const route of routes) {
        if (!route.path) {
          // Si es un header sin path, buscar en subrutas
          if (route.subRoutes) {
            const found = findInRoutes(route.subRoutes, targetPath);
            if (found) return found;
          }
          continue;
        }

        // Intentar match exacto
        if (route.path === targetPath) {
          return { name: route.name, icon: route.icon };
        }

        // Intentar match con parámetros dinámicos usando matchPath correctamente
        const match = matchPath({ path: route.path, end: true }, targetPath);
        if (match) {
          // Si tiene parámetros, agregarlos al nombre del tab
          const params = match.params;
          const paramValues = Object.values(params).filter(Boolean);

          // Crear un nombre descriptivo con el parámetro
          const displayName = paramValues.length > 0
            ? `${route.name}: ${paramValues[0]}`
            : route.name;

          return { name: displayName, icon: route.icon };
        }

        // Buscar en subrutas
        if (route.subRoutes) {
          const found = findInRoutes(route.subRoutes, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const info = findInRoutes(protectedRoutes, path);
    return info || { name: 'Sin título', icon: undefined };
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


  //Cerrar tab actual o una tab específica

  const closeCurrentTab = useCallback((tabIdToClose?: string) => {
    const targetTabId = tabIdToClose || activeTabId;

    console.log('🔵 closeCurrentTab llamado con:', targetTabId);
    console.log('📊 Estado en closeCurrentTab:', {
      tabs: tabs.map(t => ({ id: t.id, title: t.title })),
      activeTabId
    });

    // No permitir cerrar si solo hay 1 tab
    if (tabs.length <= 1) {
      console.log('⚠️ No se puede cerrar la última tab');
      return;
    }

    if (!targetTabId) {
      console.log('⚠️ No hay targetTabId');
      return;
    }

    console.log('🗑️ Intentando cerrar tab:', targetTabId);

    // Activar bandera para prevenir recreación de tab
    isClosingTabRef.current = true;

    // Remover la tab actual o específica
    // IMPORTANTE: removeTab actualiza automáticamente el activeTabId al siguiente tab disponible
    removeTab(targetTabId);

    // Después de remover, obtener el nuevo activeTabId del store y navegar a esa tab
    setTimeout(() => {
      const state = useTabStore.getState();
      console.log('🔍 Estado después de removeTab:', {
        tabs: state.tabs.map(t => ({ id: t.id, title: t.title })),
        activeTabId: state.activeTabId
      });

      const newActiveTab = state.tabs.find(tab => tab.id === state.activeTabId);

      if (newActiveTab) {
        console.log('🚀 Navegando a:', newActiveTab.path);
        navigate(newActiveTab.path);
      } else if (state.tabs.length > 0) {
        // Fallback: navegar a la primera tab disponible
        console.log('🚀 Fallback: Navegando a primera tab:', state.tabs[0].path);
        navigate(state.tabs[0].path);
      } else {
        // No quedan tabs, navegar al dashboard
        console.log('🚀 No quedan tabs, navegando a dashboard');
        navigate('/dashboard');
      }

      // Desactivar bandera después de navegar
      setTimeout(() => {
        isClosingTabRef.current = false;
      }, 100);
    }, 0);
  }, [activeTabId, removeTab, navigate, tabs]);


  //Migrar tabs antiguos y recuperar iconos desde localStorage (solo una vez al montar)
  useEffect(() => {
    tabs.forEach(tab => {
      const needsUpdate =
        tab.title === tab.path ||
        tab.title.startsWith('/') ||
        !tab.icon;

      if (needsUpdate) {
        const routeInfo = findRouteInfo(tab.path);
        updateTab(tab.id, {
          title: routeInfo.name,
          icon: routeInfo.icon
        });
      }
    });
  }, []);


  //Si navegamos sin usar navigateWithTab, esto crea/activa el tab automáticamente
  useEffect(() => {
    const currentPath = location.pathname;

    // Ignorar rutas públicas
    if (currentPath === '/' || currentPath.startsWith('/auth')) {
      return;
    }

    // Si estamos cerrando una tab, no crear tabs nuevas
    if (isClosingTabRef.current) {
      console.log('⏸️ Ignorando sincronización porque se está cerrando una tab');
      return;
    }

    const existingTab = findTabByPath(currentPath);

    if (!existingTab) {
      // Crear tab automáticamente si no existe
      console.log('➕ Creando nueva tab para:', currentPath);
      const routeInfo = findRouteInfo(currentPath);
      const tabId = addTab(currentPath, routeInfo.name, routeInfo.icon);
      setActiveTab(tabId);
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
        const { updateTab } = useTabStore.getState();
        updateTab(existingTab.id, {
          title: routeInfo.name,
          icon: routeInfo.icon
        });
      }

      if (existingTab.id !== activeTabId) {
        // Activar el tab si ya existe pero no está activo
        setActiveTab(existingTab.id);
      }
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
