import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transferService } from "../services/transfer.service";
import { TRANSFER_QUERY_KEYS } from "../constants/transferQueryKeys";

export const useAcceptTransfer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => transferService.accept(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSFER_QUERY_KEYS.lists() });
        },
        retry: false,
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 3,
    });
};
