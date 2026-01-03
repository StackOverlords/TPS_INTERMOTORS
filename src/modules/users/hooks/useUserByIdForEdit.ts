import { useQuery } from "@tanstack/react-query";
import { fetchPermissionsByUserId } from "../services/userService";

/**
 * Hook para obtener un usuario por ID para edición
 */
export const useUserByIdForEdit = (userId: number) => {
  return useQuery({
    queryKey: ["user", "edit", userId],
    queryFn: async () => await fetchPermissionsByUserId(userId),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!userId && userId > 0,
  });
};
