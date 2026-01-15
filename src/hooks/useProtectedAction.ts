import { useCallback } from 'react';
import { usePermissionCheck } from './usePermissionCheck';
import { useToast } from '@/components/atoms/use-toast';
import type { UserRole } from './useUserRole';

/**
 * Opciones para proteger una acción
 */
interface UseProtectedActionOptions {
  /** Nombre del permiso requerido */
  permission: string;
  /** Array de roles permitidos */
  roles: UserRole[];
  /** Callback personalizado cuando el usuario no está autorizado */
  onUnauthorized?: () => void;
}

/**
 * Hook para proteger funciones/handlers con validación de permisos
 *
 * Este hook envuelve una función y verifica permisos antes de ejecutarla.
 * Si el usuario no está autorizado, muestra un toast de error y no ejecuta
 * la función.
 *
 * Es especialmente útil para proteger event handlers, funciones async,
 * y cualquier acción que necesite validación de permisos.
 *
 * @param action - Función a proteger
 * @param options - Opciones de validación (permiso, roles, callbacks)
 * @returns Versión protegida de la función
 *
 * @example
 * ```tsx
 * // Proteger una función de eliminación
 * const handleDelete = useProtectedAction(
 *   async (userId: number) => {
 *     await deleteUser(userId);
 *     toast({ title: 'Usuario eliminado' });
 *   },
 *   {
 *     permission: 'usu-set_estado',
 *     roles: ['Super Admin']
 *   }
 * );
 *
 * // Usar en un botón
 * <Button onClick={() => handleDelete(user.id)}>Eliminar</Button>
 *
 * // Con callback personalizado
 * const handleEdit = useProtectedAction(
 *   editUser,
 *   {
 *     permission: 'usu-editar',
 *     roles: ['Administrador', 'Super Admin'],
 *     onUnauthorized: () => {
 *       console.log('Intento de edición no autorizado');
 *     }
 *   }
 * );
 * ```
 */
export const useProtectedAction = <T extends (...args: any[]) => any>(
  action: T,
  options: UseProtectedActionOptions
): T => {
  const { permission, roles, onUnauthorized } = options;
  const { isAuthorized, isLoading } = usePermissionCheck({ permission, roles });
  const { toast } = useToast();

  const protectedAction = useCallback(
    (...args: Parameters<T>) => {
      // Si aún está cargando los permisos
      if (isLoading) {
        toast({
          title: 'Verificando permisos...',
          description: 'Por favor espera',
          variant: 'default',
        });
        return;
      }

      // Si el usuario no está autorizado
      if (!isAuthorized) {
        toast({
          title: 'Acción no permitida',
          description: 'No tienes los permisos necesarios para realizar esta acción',
          variant: 'destructive',
        });

        // Ejecutar callback personalizado si existe
        if (onUnauthorized) {
          onUnauthorized();
        }
        return;
      }

      // Usuario autorizado: ejecutar la acción
      return action(...args);
    },
    [isAuthorized, isLoading, action, onUnauthorized, toast]
  );

  return protectedAction as T;
};
