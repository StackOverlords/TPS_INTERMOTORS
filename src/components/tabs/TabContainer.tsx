import NotFound from '@/modules/shared/screens/NotFound';
import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useTabStore } from '@/states/tabStore';
import React, { useMemo, useRef } from 'react';
import { matchPath } from 'react-router';
import TabContent from './TabContent';

const TabContainer: React.FC = () => {
  // ✅ Optimizado: Solo suscribirse a lo que realmente necesitamos
  const tabs = useTabStore(state => state.tabs);
  const activeTabId = useTabStore(state => state.activeTabId);

  // Aplanar todas las rutas protegidas
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

  // ✅ Cache persistente (no se recrea en cada render)
  const routeCacheRef = useRef(new Map<string, RouteType | null>());

  // ✅ Función de búsqueda optimizada con cache persistente
  const findMatchingRoute = useMemo(() => {
    return (path: string): RouteType | undefined => {
      // Verificar cache primero
      if (routeCacheRef.current.has(path)) {
        return routeCacheRef.current.get(path) || undefined;
      }

      const route = flatRoutes.find(route => {
        if (!route.path) return false;

        // Intentar match exacto primero (más rápido para rutas estáticas)
        if (route.path === path) return true;

        // Intentar match con parámetros dinámicos usando matchPath de React Router
        const match = matchPath(
          { path: route.path, end: true },
          path
        );

        return match !== null;
      });

      // Guardar en cache
      routeCacheRef.current.set(path, route || null);
      return route;
    };
  }, [flatRoutes]);

  // ✅ OPTIMIZACIÓN CRÍTICA: Solo obtener el componente del tab ACTIVO
  // Esto evita renderizar todos los componentes al mismo tiempo
  const activeTabComponent = useMemo(() => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return null;

    const route = findMatchingRoute(activeTab.path);

    if (!route || !route.element) {
      return {
        tabId: activeTab.id,
        Component: NotFound,
      };
    }

    return {
      tabId: activeTab.id,
      Component: route.element,
    };
  }, [activeTabId, tabs, findMatchingRoute]);

  return (
    <div className="h-full relative">
      {/* ✅ LAZY RENDERING: Solo renderizamos el componente activo */}
      {activeTabComponent ? (
        <TabContent
          key={activeTabComponent.tabId}
          tabId={activeTabComponent.tabId}
          isActive={true}
        >
          <activeTabComponent.Component />
        </TabContent>
      ) : tabs.length === 0 ? (
        // Si no hay tabs, mostrar un mensaje o el dashboard por defecto
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No hay pestañas abiertas</p>
            <p className="text-sm mt-2">Navega a cualquier sección para comenzar</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TabContainer;
