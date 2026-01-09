import { TABS_CONFIG } from "@/config/tabsConfig";
import NotFound from "@/modules/shared/screens/NotFound";
import protectedRoutes from "@/navigation/Protected.Route";
import type RouteType from "@/navigation/RouteType";
import { useTabStore } from "@/states/tabStore";
import React, { useMemo, useRef } from "react";
import { matchPath } from "react-router";
import TabContent from "./TabContent";

const TabContainer: React.FC = () => {
  // ✅ Optimizado: Solo suscribirse a lo que realmente necesitamos
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);

  // 🎯 Keep-Alive: Trackear qué tabs han sido visitadas
  const mountedTabsRef = useRef<Set<string>>(new Set());

  // Aplanar todas las rutas protegidas
  const flatRoutes = useMemo(() => {
    const flatten = (routes: RouteType[]): RouteType[] => {
      const result: RouteType[] = [];
      routes.forEach((route) => {
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

      const route = flatRoutes.find((route) => {
        if (!route.path) return false;

        // Intentar match exacto primero (más rápido para rutas estáticas)
        if (route.path === path) return true;

        // Intentar match con parámetros dinámicos usando matchPath de React Router
        const match = matchPath({ path: route.path, end: true }, path);

        return match !== null;
      });

      // Guardar en cache
      routeCacheRef.current.set(path, route || null);
      return route;
    };
  }, [flatRoutes]);

  // 🎯 KEEP-ALIVE INTELIGENTE: Mantener tabs visitadas en memoria
  // Límite de tabs en memoria (configurable en src/config/tabsConfig.ts)
  const MAX_MOUNTED_TABS = TABS_CONFIG.MAX_MOUNTED_TABS;

  // Agregar tab activo a las montadas
  if (activeTabId && !mountedTabsRef.current.has(activeTabId)) {
    mountedTabsRef.current.add(activeTabId);
  }

  // Limpiar tabs que ya no existen en el store
  const existingTabIds = new Set(tabs.map((t) => t.id));
  mountedTabsRef.current.forEach((tabId) => {
    if (!existingTabIds.has(tabId)) {
      mountedTabsRef.current.delete(tabId);
    }
  });

  // Si excedemos el límite, remover las tabs más antiguas (LRU - Least Recently Used)
  if (mountedTabsRef.current.size > MAX_MOUNTED_TABS) {
    const mountedArray = Array.from(mountedTabsRef.current);
    const toRemove = mountedArray.slice(
      0,
      mountedArray.length - MAX_MOUNTED_TABS
    );
    toRemove.forEach((tabId) => mountedTabsRef.current.delete(tabId));
  }

  // Obtener componentes de todas las tabs que deben estar montadas
  const tabComponents = useMemo(() => {
    const components: Array<{
      tabId: string;
      Component: React.ComponentType;
      routePath: string;
    }> = [];

    mountedTabsRef.current.forEach((tabId) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      const route = findMatchingRoute(tab.path);

      components.push({
        tabId: tab.id,
        Component: route?.element || NotFound,
        routePath: tab.path,
      });
    });

    return components;
  }, [tabs, findMatchingRoute, activeTabId]); // activeTabId para forzar recalculo

  return (
    <div className="h-full relative">
      {/* 🎯 KEEP-ALIVE: Renderizar todas las tabs montadas, pero solo mostrar la activa */}
      {tabComponents.map(({ tabId, Component, routePath }) => (
        <TabContent
          key={tabId}
          tabId={tabId}
          isActive={tabId === activeTabId}
          routePath={routePath}
        >
          <Component />
        </TabContent>
      ))}

      {/* Si no hay tabs, mostrar un mensaje o el dashboard por defecto */}
      {tabs.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No hay pestañas abiertas</p>
            <p className="text-sm mt-2">
              Navega a cualquier sección para comenzar
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabContainer;
