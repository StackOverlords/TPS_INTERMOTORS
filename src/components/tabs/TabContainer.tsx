import NotFound from '@/modules/shared/screens/NotFound';
import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useTabStore } from '@/states/tabStore';
import { useMemo } from 'react';
import { matchPath } from 'react-router';
import TabContent from './TabContent';

/**
 * Componente que renderiza todas las vistas de tabs activos
 * Cada tab mantiene su propia instancia del componente
 */
const TabContainer: React.FC = () => {
  const { tabs } = useTabStore();

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

  // Encontrar la ruta que coincide con el path actual
  // Soporte para rutas dinámicas con parámetros (ej: /purchases/:id)
  const findMatchingRoute = (path: string): RouteType | undefined => {
    return flatRoutes.find(route => {
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
  };

  return (
    <div className="h-full relative">
      {tabs.map(tab => {
        const route = findMatchingRoute(tab.path);

        if (!route || !route.element) {
          return (
            <TabContent key={tab.id} tabId={tab.id}>
              <NotFound />
            </TabContent>
          );
        }

        const Component = route.element;

        return (
          <TabContent key={tab.id} tabId={tab.id}>
            <Component />
          </TabContent>
        );
      })}

      {/* Si no hay tabs, mostrar un mensaje o el dashboard por defecto */}
      {tabs.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No hay pestañas abiertas</p>
            <p className="text-sm mt-2">Navega a cualquier sección para comenzar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabContainer;
