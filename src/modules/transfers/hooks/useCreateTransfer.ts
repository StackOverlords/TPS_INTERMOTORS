import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transferService } from "../services/transfer.service";
import type { TransferCreate } from "../types/transferCreate.types";
import { TRANSFER_QUERY_KEYS } from "../constants/transferQueryKeys";

export const useCreateTransfer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: TransferCreate) => transferService.create(data),
        onSuccess: () => {
            // Invalidar la lista de transferencias para refrescar los datos
            queryClient.invalidateQueries({
                queryKey: TRANSFER_QUERY_KEYS.lists(),
            });
        },
    });
};
