import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { useEffect, useState } from 'react';

export type UserRole = 'Super Admin' | 'Administrador' | 'Vendedor' | 'guest' | 'Invitado';

interface UserRoleData {
  rol: UserRole;
  isLoading: boolean;
}

/**
 * Deriva el rol activo del usuario según la sucursal seleccionada.
 *
 * Lógica de resolución:
 * 1. Si `selectedBranchId` está definido → busca la sucursal con ese ID y usa su `.rol`
 * 2. Si no hay coincidencia o `selectedBranchId` es null → usa `sucursales[0].rol` (fallback)
 * 3. Si el usuario no tiene sucursales → retorna 'guest'
 *
 * El hook es REACTIVO: se actualiza cuando authSDK emite un cambio de estado
 * o cuando el usuario cambia de sucursal en el store (sin recarga de página).
 */
export const useUserRole = (): UserRoleData => {
  const [rol, setRol] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);

  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);

  /**
   * Resuelve el rol a partir de las sucursales del usuario y el branchId activo.
   * Si selectedBranchId no coincide con ninguna sucursal, cae al primero (compat).
   */
  const resolveRole = (sucursales: Array<{ id: string | number; rol: string }> | undefined): UserRole => {
    if (!sucursales || sucursales.length === 0) return 'guest';

    if (selectedBranchId) {
      const activeBranch = sucursales.find(
        (s) => String(s.id) === String(selectedBranchId)
      );
      if (activeBranch?.rol) return activeBranch.rol as UserRole;
    }

    // Fallback: primera sucursal (compatibilidad con código anterior)
    return (sucursales[0].rol as UserRole) || 'guest';
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { user } = await authSDK.getState();
        setRol(resolveRole(user?.sucursales));
      } catch (error) {
        console.error('Error al obtener el rol del usuario:', error);
        setRol('guest');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();

    // Suscribirse a cambios en el estado de autenticación
    const unsubscribe = authSDK.onAuthStateChanged((authState) => {
      setRol(resolveRole(authState.user?.sucursales));
    });

    return () => unsubscribe();
  // selectedBranchId es una dependencia: cuando cambia, el rol debe re-derivarse
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  return { rol, isLoading };
};
