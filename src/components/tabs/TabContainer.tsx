import ErrorBoundary from "@/components/common/ErrorBoundary";
import NotFound from "@/modules/shared/screens/NotFound";
import { preloadScreens } from "@/navigation/lazyScreen";
import protectedRoutes from "@/navigation/Protected.Route";
import type RouteType from "@/navigation/RouteType";
import { useRegistryRoutes } from "@/plugins";
import { useTabStore } from "@/states/tabStore";
import { useTabsConfigStore } from "@/stores/tabsConfigStore";
import { Loader2 } from "lucide-react";
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { matchPath } from "react-router";
import TabContent from "./TabContent";
import TabRouterScope from "./TabRouterScope";

/** Se ve solo la primera vez que se abre una pantalla cuyo chunk aún no llegó. */
const ScreenFallback = () => (
  <div className="flex h-full items-center justify-center text-muted-foreground">
    <Loader2 className="size-5 animate-spin" aria-label="Cargando pantalla" />
  </div>
);

const TabContainer: React.FC = () => {
  // Optimizado: Solo suscribirse a lo que realmente necesitamos
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);

  // Keep-Alive: Trackear qué tabs han sido visitadas
  const mountedTabsRef = useRef<Set<string>>(new Set());
  const lastUsedRef = useRef(new Map<string, number>());
  const useCounterRef = useRef(0);

  // Elemento de pantalla por tab, reutilizado entre renders. Al cambiar de
  // pestaña, TabContent se re-renderiza por `isActive`; si recibiera un
  // elemento nuevo, React volvería a renderizar la pantalla entera (tabla,
  // filtros, menús) aunque nada de ella cambió. Con el mismo elemento, solo se
  // actualiza lo que lee contextos que sí cambiaron.
  const screenElementsRef = useRef(
    new Map<string, { Component: React.ComponentType; routePath: string; element: React.ReactElement }>(),
  );
  const getScreenElement = (tabId: string, Component: React.ComponentType, routePath: string) => {
    const cached = screenElementsRef.current.get(tabId);
    if (cached && cached.Component === Component && cached.routePath === routePath) {
      return cached.element;
    }
    const element = (
      <ErrorBoundary name={`tab ${routePath}`}>
        <Suspense fallback={<ScreenFallback />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );
    screenElementsRef.current.set(tabId, { Component, routePath, element });
    return element;
  };

  // Rutas aportadas por plugins — reactivas vía useSyncExternalStore.
  // Se re-calculan cuando un plugin registra o des-registra rutas, sin reload.
  const registryRoutes = useRegistryRoutes();

  // Aplanar todas las rutas protegidas (estáticas + plugin)
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

    // Adaptar RouteConfig (SDK) → RouteType para que TabContainer pueda
    // resolver el componente de las tabs de plugin igual que las estáticas.
    const pluginAsRouteType: RouteType[] = registryRoutes.map((rc) => ({
      path: rc.path,
      element: rc.component,
      name: rc.label,
      type: "protected" as const,
      icon: rc.icon,
    }));

    return [...flatten(protectedRoutes), ...pluginAsRouteType];
  }, [registryRoutes]);

  // Las pantallas se cargan bajo demanda (lazyScreen). Tras el arranque se
  // precargan en segundo plano para que abrir cualquier pestaña sea inmediato.
  useEffect(
    () => preloadScreens(flatRoutes.map((route) => route.element)),
    [flatRoutes],
  );

  // Cache persistente (no se recrea en cada render)
  const routeCacheRef = useRef(new Map<string, RouteType | null>());

  // Función de búsqueda optimizada con cache persistente
  const findMatchingRoute = useMemo(() => {
    // Invalidar cache cuando flatRoutes cambia (p.ej. un plugin registra/des-registra rutas).
    // Sin esto, el cache devolvería null para rutas de plugin recién registradas.
    routeCacheRef.current.clear();

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

  // KEEP-ALIVE INTELIGENTE: Mantener tabs visitadas en memoria
  // Límite configurable desde Settings > Avanzado
  const MAX_MOUNTED_TABS = useTabsConfigStore((state) => state.maxMountedTabs);

  // Agregar tab activo a las montadas
  if (activeTabId && !mountedTabsRef.current.has(activeTabId)) {
    mountedTabsRef.current.add(activeTabId);
  }

  // Orden de uso para la expulsión LRU. El Set de montadas conserva el orden de
  // montaje (y con él el orden en el DOM, que no conviene mover); sin este
  // registro la expulsión era FIFO y podía desmontar la pestaña más usada.
  if (activeTabId && lastUsedRef.current.get(activeTabId) !== useCounterRef.current) {
    lastUsedRef.current.set(activeTabId, ++useCounterRef.current);
  }

  // Limpiar tabs que ya no existen en el store
  const existingTabIds = new Set(tabs.map((t) => t.id));
  mountedTabsRef.current.forEach((tabId) => {
    if (!existingTabIds.has(tabId)) {
      mountedTabsRef.current.delete(tabId);
      lastUsedRef.current.delete(tabId);
    }
  });

  // Si excedemos el límite, remover las tabs más antiguas (LRU - Least Recently Used)
  // Las tabs keepAlive (formularios) nunca se desmontan — son inmunes al LRU
  if (mountedTabsRef.current.size > MAX_MOUNTED_TABS) {
    const mountedArray = Array.from(mountedTabsRef.current);
    const evictable = mountedArray.filter((tabId) => {
      // Nunca la que se está mostrando.
      if (tabId === activeTabId) return false;
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return true;
      const route = findMatchingRoute(tab.path);
      return !route?.keepAlive;
    });
    const lastUsed = (tabId: string) => lastUsedRef.current.get(tabId) ?? 0;
    evictable.sort((a, b) => lastUsed(a) - lastUsed(b));
    const excess = mountedTabsRef.current.size - MAX_MOUNTED_TABS;
    evictable.slice(0, excess).forEach((tabId) => mountedTabsRef.current.delete(tabId));
  }

  // Los elementos cacheados solo de las tabs que siguen montadas.
  screenElementsRef.current.forEach((_, tabId) => {
    if (!mountedTabsRef.current.has(tabId)) screenElementsRef.current.delete(tabId);
  });

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
      {/* KEEP-ALIVE: Renderizar todas las tabs montadas, pero solo mostrar la activa */}
      {tabComponents.map(({ tabId, Component, routePath }) => (
        <TabContent
          key={tabId}
          tabId={tabId}
          isActive={tabId === activeTabId}
          routePath={routePath}
        >
          <TabRouterScope active={tabId === activeTabId}>
            {getScreenElement(tabId, Component, routePath)}
          </TabRouterScope>
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
