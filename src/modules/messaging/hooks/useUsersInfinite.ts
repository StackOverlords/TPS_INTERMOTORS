/**
 * useUsersInfinite.ts
 *
 * TanStack Query useInfiniteQuery para cargar usuarios con scroll infinito.
 * Usa el mismo fetchUsers del módulo de usuarios.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/modules/users/services/userService';

const PAGE_SIZE = 20;

export function useUsersInfinite(search: string) {
  return useInfiniteQuery({
    queryKey: ['users-infinite', search],
    queryFn: ({ pageParam = 1 }) =>
      fetchUsers({
        pagina: pageParam as number,
        pagina_registros: PAGE_SIZE,
        // ⚠️ Si tu endpoint soporta filtro por nombre, agrégalo aquí:
        // nombre: search || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current_page, last_page } = lastPage.meta;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}