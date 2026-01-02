import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import type { UserCreate } from "../../types/UserCreate.types";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreate) => userService.create(data),
    onSuccess: () => {
      // Invalidar cache de usuarios para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
