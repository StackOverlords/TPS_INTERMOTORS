import type { UserRole } from '@/hooks/useUserRole';
import type RouteType from '@/navigation/RouteType';

/**
 * Verifica si un usuario tiene permiso para acceder a una ruta
 * @param route - La ruta a verificar
 * @param userRole - El rol del usuario actual
 * @returns true si el usuario tiene permiso, false en caso contrario
 */
export const hasRouteAccess = (route: RouteType, userRole: UserRole): boolean => {
  // Si la ruta no tiene roles definidos, permitir acceso
  if (!route.role || route.role.length === 0) {
    return true;
  }

  // Verificar si el rol del usuario está en los roles permitidos de la ruta
  return route.role.includes(userRole);
};

/**
 * Filtra una lista de rutas basándose en los permisos del usuario
 * @param routes - Lista de rutas a filtrar
 * @param userRole - El rol del usuario actual
 * @returns Lista de rutas filtradas a las que el usuario tiene acceso
 */
export const filterRoutesByRole = (
  routes: RouteType[],
  userRole: UserRole
): RouteType[] => {
  return routes
    .filter((route) => hasRouteAccess(route, userRole))
    .map((route) => {
      // Si la ruta tiene subrutas, también filtrarlas
      if (route.subRoutes && route.subRoutes.length > 0) {
        return {
          ...route,
          subRoutes: filterRoutesByRole(route.subRoutes, userRole),
        };
      }
      return route;
    });
};

/**
 * Verifica si un usuario es administrador
 * @param userRole - El rol del usuario
 * @returns true si es administrador
 */
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'Administrador';
};

/**
 * Verifica si un usuario es vendedor
 * @param userRole - El rol del usuario
 * @returns true si es vendedor
 */
export const isVendedor = (userRole: UserRole): boolean => {
  return userRole === 'Vendedor';
};
