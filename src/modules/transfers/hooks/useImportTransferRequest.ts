import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TRANSFER_REQUEST_QUERY_KEYS } from "../constants/transferRequestQueryKeys";
import { transferRequestService } from "../services/transferRequestService";

export const useImportTransferRequest = (id: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => transferRequestService.import(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: TRANSFER_REQUEST_QUERY_KEYS.detail(id),
            });
        },
    });
};
