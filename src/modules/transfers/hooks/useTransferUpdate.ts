import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transferService } from "../services/transfer.service";
import { TRANSFER_QUERY_KEYS } from "../constants/transferQueryKeys";
import type { TransferGetById } from "../types/transferGet.types";

interface UpdateTransferVariables {
  id: number;
  data: any;
}

export const useTransferUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateTransferVariables) =>
      transferService.update(id, data),
    onSuccess: (updatedTransfer: TransferGetById, variables) => {
      // Invalidar la query específica de la transferencia actualizada
      queryClient.invalidateQueries({
        queryKey: TRANSFER_QUERY_KEYS.detail(variables.id),
      });

      // Invalidar la lista de transferencias para reflejar cambios
      queryClient.invalidateQueries({
        queryKey: TRANSFER_QUERY_KEYS.lists(),
      });

      // Opcional: Actualizar el caché directamente con los datos actualizados
      queryClient.setQueryData(
        TRANSFER_QUERY_KEYS.detail(variables.id),
        updatedTransfer
      );
    },
  });
};
