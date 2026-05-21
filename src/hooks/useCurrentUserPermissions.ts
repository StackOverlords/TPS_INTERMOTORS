import { useQuery } from '@tanstack/react-query';
import { useBranchStore } from '@/states/branchStore';
import { fetchMyPermissions } from '@/modules/users/services/userService';
import { PERMISSIONS_QUERY_KEYS } from '@/lib/queryKeys';
import type { Permission } from '@/modules/users/types/User';

/**
 * Interfaz para los datos de permisos del usuario actual
 */
interface UserPermissionsData {
  permissions: Permission[];
  isLoading: boolean;
  isError: boolean;
  hasPermission: (permissionName: string) => boolean;
}

/**
 * Hook para obtener y cachear los permisos del usuario autenticado actual.
 *
 * Cambios respecto a la versión anterior:
 * - Usa un único endpoint `/users/mypermission` en lugar de la cadena de 2 llamadas
 *   (nickname → id → permissions). El backend devuelve los permisos del usuario
 *   autenticado directamente.
 * - El query key incluye `selectedBranchId` para que cada sucursal tenga su propia
 *   entrada en caché. Al cambiar de sucursal, el hook obtiene los permisos correctos
 *   sin mezclar datos entre sucursales.
 * - `isLoading` es superficiado individualmente para que los componentes puedan
 *   mostrar skeletons en lugar de un estado "denegado" mientras se cargan los datos.
 *
 * @returns {UserPermissionsData} Objeto con permisos, estados de carga y función helper
 *
 * @example
 * ```tsx
 * const { permissions, isLoading, hasPermission } = useCurrentUserPermissions();
 *
 * if (hasPermission('usu-create')) {
 *   // Mostrar botón de crear usuario
 * }
 * ```
 */
export const useCurrentUserPermissions = (): UserPermissionsData => {
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);

  // Query única: /users/mypermission — el backend resuelve el usuario desde el token
  // El branchId en la key aísla la caché por sucursal: cambiar de sucursal usa
  // una entrada diferente, sin invalidar las otras (evita flashes de permisos erróneos)
  const {
    data: permissions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.currentUser(selectedBranchId),
    queryFn: fetchMyPermissions,
    staleTime: 1000 * 60 * 5,  // 5 minutos
    gcTime: 1000 * 60 * 10,    // 10 minutos
  });

  /**
   * Función helper para verificar si el usuario tiene un permiso específico.
   * @param permissionName - Nombre del permiso a verificar (ej: 'usu-create')
   * @returns true si el usuario tiene el permiso, false en caso contrario
   */
  const hasPermission = (permissionName: string): boolean => {
    return permissions.some((p) => p.name === permissionName);
  };

  return {
    permissions,
    isLoading,
    isError,
    hasPermission,
  };
};
