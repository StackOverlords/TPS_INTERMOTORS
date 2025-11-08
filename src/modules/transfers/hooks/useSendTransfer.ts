import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TRANSFER_QUERY_KEYS } from "../constants/transferQueryKeys";
import { transferService } from "../services/transfer.service";

export const useSendTransfer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => transferService.send(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSFER_QUERY_KEYS.lists() });
        },
        retry: false,
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 3,
    });
};
