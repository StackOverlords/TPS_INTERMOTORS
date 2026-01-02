import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import type { UserUpdate } from "../../types/UserUpdate.types";

interface UpdateUserParams {
  id: number;
  data: UserUpdate;
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateUserParams) => userService.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar cache de usuarios
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Invalidar cache del usuario específico
      queryClient.invalidateQueries({ queryKey: ["permissions", variables.id] });
    },
  });
};
