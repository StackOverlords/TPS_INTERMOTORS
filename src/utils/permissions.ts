import type { UserRole } from '@/hooks/useUserRole';
import type RouteType from '@/navigation/RouteType';
import type { Permission } from '@/modules/users/types/User';

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

// ============================================================================
// FUNCIONES DE VALIDACIÓN DE PERMISOS GRANULARES
// ============================================================================

/**
 * Verifica si el usuario tiene un permiso específico
 * @param userPermissions - Array de permisos del usuario
 * @param permissionName - Nombre del permiso a verificar (ej: 'usu-create')
 * @returns true si el usuario tiene el permiso, false en caso contrario
 *
 * @example
 * ```ts
 * const canCreate = hasPermission(permissions, 'usu-create');
 * ```
 */
export const hasPermission = (
  userPermissions: Permission[],
  permissionName: string
): boolean => {
  return userPermissions.some(p => p.name === permissionName);
};

/**
 * Verifica si el usuario tiene TODOS los permisos especificados (lógica AND)
 * @param userPermissions - Array de permisos del usuario
 * @param permissionNames - Array de nombres de permisos requeridos
 * @returns true si el usuario tiene todos los permisos, false en caso contrario
 *
 * @example
 * ```ts
 * const canEditAndDelete = hasAllPermissions(permissions, ['usu-editar', 'usu-delete']);
 * ```
 */
export const hasAllPermissions = (
  userPermissions: Permission[],
  permissionNames: string[]
): boolean => {
  return permissionNames.every(name => hasPermission(userPermissions, name));
};

/**
 * Verifica si el usuario tiene ALGUNO de los permisos especificados (lógica OR)
 * @param userPermissions - Array de permisos del usuario
 * @param permissionNames - Array de nombres de permisos a verificar
 * @returns true si el usuario tiene al menos uno de los permisos, false en caso contrario
 *
 * @example
 * ```ts
 * const canEditOrDelete = hasAnyPermission(permissions, ['usu-editar', 'usu-delete']);
 * ```
 */
export const hasAnyPermission = (
  userPermissions: Permission[],
  permissionNames: string[]
): boolean => {
  return permissionNames.some(name => hasPermission(userPermissions, name));
};

/**
 * Verifica si el usuario tiene el rol requerido
 * @param userRole - Rol actual del usuario
 * @param requiredRoles - Array de roles permitidos
 * @returns true si el usuario tiene uno de los roles requeridos, false en caso contrario
 */
export const hasRequiredRole = (
  userRole: UserRole,
  requiredRoles: UserRole[]
): boolean => {
  return requiredRoles.includes(userRole);
};

/**
 * Validación combinada: ROL + PERMISO (lógica AND)
 *
 * El usuario debe tener TANTO el rol correcto COMO el permiso específico
 * para estar autorizado. Esta es la función principal de validación del sistema.
 *
 * @param userRole - Rol actual del usuario
 * @param userPermissions - Array de permisos del usuario
 * @param requiredRoles - Array de roles permitidos
 * @param requiredPermission - Nombre del permiso requerido
 * @returns true si el usuario tiene rol Y permiso, false en caso contrario
 *
 * @example
 * ```ts
 * const authorized = isAuthorized(
 *   userRole,
 *   permissions,
 *   ['Super Admin'],
 *   'usu-create'
 * );
 * ```
 */
export const isAuthorized = (
  userRole: UserRole,
  userPermissions: Permission[],
  requiredRoles: UserRole[],
  requiredPermission: string
): boolean => {
  const roleCheck = hasRequiredRole(userRole, requiredRoles);
  const permissionCheck = hasPermission(userPermissions, requiredPermission);

  // Ambos deben ser verdaderos (lógica AND)
  return roleCheck && permissionCheck;
};

/**
 * Validación flexible con múltiples permisos (lógica OR en permisos)
 *
 * El usuario debe tener el rol correcto Y al menos uno de los permisos especificados.
 *
 * @param userRole - Rol actual del usuario
 * @param userPermissions - Array de permisos del usuario
 * @param requiredRoles - Array de roles permitidos
 * @param requiredPermissions - Array de permisos (se requiere al menos uno)
 * @returns true si el usuario tiene rol Y alguno de los permisos, false en caso contrario
 *
 * @example
 * ```ts
 * const authorized = isAuthorizedWithAny(
 *   userRole,
 *   permissions,
 *   ['Administrador', 'Super Admin'],
 *   ['usu-editar', 'usu-create']
 * );
 * ```
 */
export const isAuthorizedWithAny = (
  userRole: UserRole,
  userPermissions: Permission[],
  requiredRoles: UserRole[],
  requiredPermissions: string[]
): boolean => {
  const roleCheck = hasRequiredRole(userRole, requiredRoles);
  const permissionCheck = hasAnyPermission(userPermissions, requiredPermissions);

  // Ambos deben ser verdaderos (lógica AND entre rol y permisos)
  return roleCheck && permissionCheck;
};
