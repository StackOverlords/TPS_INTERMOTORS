import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../services/userService";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      // Invalidar cache de usuarios para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
