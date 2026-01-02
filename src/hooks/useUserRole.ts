import authSDK from '@/services/sdk-simple-auth';
import { useEffect, useState } from 'react';

export type UserRole = 'Administrador' | 'Vendedor' | 'guest';

interface UserRoleData {
  rol: UserRole;
  isLoading: boolean;
}

export const useUserRole = (): UserRoleData => {
  const [rol, setRol] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { user } = await authSDK.getState();
        if (user?.sucursales && user.sucursales.length > 0) {
          // Obtenemos el rol de la primera sucursal
          const userRole = user.sucursales[0].rol as UserRole;
          setRol(userRole || 'guest');
        } else {
          setRol('guest');
        }
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
      if (authState.user?.sucursales && authState.user.sucursales.length > 0) {
        const userRole = authState.user.sucursales[0].rol as UserRole;
        setRol(userRole || 'guest');
      } else {
        setRol('guest');
      }
    });

    return () => unsubscribe();
  }, []);

  return { rol, isLoading };
};
