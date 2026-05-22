import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TRANSFER_REQUEST_QUERY_KEYS } from "../constants/transferRequestQueryKeys";
import { transferRequestService } from "../services/transferRequestService";

export const useLinkTransferRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ requestId, transferId }: { requestId: number; transferId: number }) =>
            transferRequestService.linkTransfer(requestId, transferId),
        onSuccess: (_data, { requestId }) => {
            queryClient.invalidateQueries({
                queryKey: TRANSFER_REQUEST_QUERY_KEYS.detail(requestId),
            });
        },
    });
};
