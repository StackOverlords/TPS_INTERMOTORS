import type { ViewConfiguration } from '@/config/viewConfigTypes';
import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import { useMemo } from 'react';

export function useAllRouteConfigs(): ViewConfiguration[] {
  const configs = useMemo(() => {
    const allConfigs: ViewConfiguration[] = [];

    const processRoute = (route: RouteType) => {
      if (route.viewConfig && route.viewConfig.id) {
        allConfigs.push(route.viewConfig);
      }

      if (route.subRoutes) {
        route.subRoutes.forEach(processRoute);
      }
    };

    protectedRoutes.forEach(processRoute);

    return allConfigs;
  }, []);

  return configs;
}
