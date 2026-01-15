import { useUserRole } from './useUserRole';
import { useCurrentUserPermissions } from './useCurrentUserPermissions';
import { hasPermission, hasAnyPermission } from '@/utils/permissions';
import type { UserRole } from './useUserRole';

/**
 * Resultado de la validación de permisos
 */
interface PermissionCheckResult {
  /** Si el usuario está autorizado (rol Y permiso) */
  isAuthorized: boolean;
  /** Si los datos están cargando */
  isLoading: boolean;
  /** Si el usuario tiene el rol requerido */
  hasRole: boolean;
  /** Si el usuario tiene el permiso requerido */
  hasPermission: boolean;
}

/**
 * Opciones para la validación de permisos
 */
interface UsePermissionCheckOptions {
  /** Nombre del permiso requerido (ej: 'usu-create') */
  permission: string;
  /** Array de roles permitidos */
  roles: UserRole[];
  /** Si se requieren ambos (rol Y permiso). Default: true (lógica AND) */
  requireBoth?: boolean;
  bypassForSuperAdmin?: boolean;
}

/**
 * Hook para validar permisos y roles combinados
 *
 * Este hook combina la validación de rol (desde useUserRole) y permisos
 * (desde useCurrentUserPermissions) para determinar si un usuario está
 * autorizado a realizar una acción.
 *
 * Por defecto usa lógica AND: el usuario debe tener TANTO el rol correcto
 * COMO el permiso específico.
 *
 * @param options - Opciones de validación (permiso, roles, requireBoth)
 * @returns Objeto con el estado de autorización y detalles
 *
 * @example
 * ```tsx
 * const { isAuthorized, isLoading } = usePermissionCheck({
 *   permission: 'usu-create',
 *   roles: ['Super Admin']
 * });
 *
 * if (isAuthorized) {
 *   // Usuario puede crear usuarios
 * }
 * ```
 */
export const usePermissionCheck = (
  options: UsePermissionCheckOptions
): PermissionCheckResult => {
  const { permission, roles, requireBoth = true, bypassForSuperAdmin = true } = options;
  const { rol: userRole, isLoading: isLoadingRole } = useUserRole();
  // console.log('🌐 usePermissionCheck: Checking permission', { permission, roles, requireBoth, userRole });
  const { permissions, isLoading: isLoadingPermissions } = useCurrentUserPermissions();
  // console.log('🌐 usePermissionCheck: Current permissions', permissions.map(p => p.name));

  const isLoading = isLoadingRole || isLoadingPermissions;

  // Debug logging
  // console.log('🔍 usePermissionCheck Debug:', {
  //   permission,
  //   requiredRoles: roles,
  //   userRole,
  //   permissions: permissions.map(p => p.name),
  //   isLoadingRole,
  //   isLoadingPermissions,
  //   isLoading
  // });

  if (isLoading) {
    return {
      isAuthorized: false,
      isLoading: true,
      hasRole: false,
      hasPermission: false,
    };
  }

  const hasRole = roles.includes(userRole);
  const hasPerm = hasPermission(permissions, permission);

  // Super Admin bypass
  const isSuperAdmin = userRole === 'Super Admin';

  const authorized = (isSuperAdmin && bypassForSuperAdmin) ? // El bypasss porsiacasoo
  true :
  requireBoth
    ? (hasRole && hasPerm) //ambos necesarios
    : (hasRole || hasPerm); //cualquiera vale

  // Lógica de autorización
  // const authorized = requireBoth
  //   ? (hasRole && hasPerm) // AND logic (default) - ambos necesarios
  //   : (hasRole || hasPerm); // OR logic - cualquiera vale

  console.log('✅ usePermissionCheck Result:', {
    hasRole,
    hasPermission: hasPerm,
    authorized,
    reason: !hasRole ? 'Missing role' : !hasPerm ? 'Missing permission' : 'OK'
  });

  return {
    isAuthorized: authorized,
    isLoading: false,
    hasRole,
    hasPermission: hasPerm,
  };
};

/**
 * Hook para validar múltiples permisos (cualquiera de ellos)
 *
 * Verifica si el usuario tiene el rol correcto Y al menos uno de los
 * permisos especificados.
 *
 * @param permissions - Array de nombres de permisos (se requiere al menos uno)
 * @param roles - Array de roles permitidos
 * @returns Objeto con el estado de autorización y detalles
 *
 * @example
 * ```tsx
 * const { isAuthorized } = usePermissionCheckAny(
 *   ['usu-editar', 'usu-create'],
 *   ['Administrador', 'Super Admin']
 * );
 * ```
 */
export const usePermissionCheckAny = (
  permissions: string[],
  roles: UserRole[]
): PermissionCheckResult => {
  const { rol: userRole, isLoading: isLoadingRole } = useUserRole();
  const { permissions: userPermissions, isLoading: isLoadingPermissions } = useCurrentUserPermissions();

  const isLoading = isLoadingRole || isLoadingPermissions;

  if (isLoading) {
    return {
      isAuthorized: false,
      isLoading: true,
      hasRole: false,
      hasPermission: false,
    };
  }

  const hasRole = roles.includes(userRole);
  const hasPerm = hasAnyPermission(userPermissions, permissions);

  // El usuario necesita el rol Y al menos uno de los permisos
  const authorized = hasRole && hasPerm;

  return {
    isAuthorized: authorized,
    isLoading: false,
    hasRole,
    hasPermission: hasPerm,
  };
};
