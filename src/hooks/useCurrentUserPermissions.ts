import { useQuery } from '@tanstack/react-query';
import authSDK from '@/services/sdk-simple-auth';
import { fetchUserByNickName, fetchUserPermissions } from '@/modules/users/services/userService';
import { useState, useEffect } from 'react';
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
 * Hook para obtener y cachear los permisos del usuario autenticado actual
 *
 * Este hook:
 * - Obtiene el ID del usuario desde el nickname (authSDK no provee ID directamente)
 * - Se subscribe a cambios en el estado de autenticación
 * - Usa React Query para cachear tanto el usuario como los permisos
 * - Proporciona una función helper para verificar permisos individuales
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
  const [userNickname, setUserNickname] = useState<string | null>(null);

  useEffect(() => {
    // Obtener nickname inicial del usuario autenticado
    const currentUser = authSDK.getCurrentUser();
    setUserNickname(currentUser?.name || null);

    // Suscribirse a cambios en el estado de autenticación
    const unsubscribe = authSDK.onAuthStateChanged((authState) => {
      setUserNickname(authState.user?.name || null);
    });

    return () => unsubscribe();
  }, []);

  // Query 1: Obtener datos del usuario (incluye ID) basado en nickname
  const {
    data: userData,
    isLoading: isLoadingUser,
    isError: isErrorUser
  } = useQuery({
    queryKey: ['currentUser', userNickname],
    queryFn: async () => {
      if (!userNickname) return null;
      return await fetchUserByNickName(userNickname);
    },
    enabled: !!userNickname,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Query 2: Obtener permisos del usuario basado en su ID
  const {
    data: permissions = [],
    isLoading: isLoadingPermissions,
    isError: isErrorPermissions
  } = useQuery({
    queryKey: ['currentUserPermissions', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return [];
      return await fetchUserPermissions(userData.id);
    },
    enabled: !!userData?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  /**
   * Función helper para verificar si el usuario tiene un permiso específico
   * @param permissionName - Nombre del permiso a verificar (ej: 'usu-create')
   * @returns true si el usuario tiene el permiso, false en caso contrario
   */
  const hasPermission = (permissionName: string): boolean => {
    return permissions.some(p => p.name === permissionName);
  };

  // Debug logging
  console.log('📋 useCurrentUserPermissions:', {
    userNickname,
    userId: userData?.id,
    permissionsCount: permissions.length,
    permissions: permissions.map(p => p.name),
    isLoadingUser,
    isLoadingPermissions
  });

  return {
    permissions,
    isLoading: isLoadingUser || isLoadingPermissions,
    isError: isErrorUser || isErrorPermissions,
    hasPermission
  };
};
