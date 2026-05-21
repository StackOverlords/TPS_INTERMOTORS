import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TRANSFER_REQUEST_QUERY_KEYS } from "../constants/transferRequestQueryKeys";
import { transferRequestService } from "../services/transferRequestService";
import type { CreateTransferRequestPayload } from "../types/transferRequest.types";

export const useCreateTransferRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTransferRequestPayload) =>
            transferRequestService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: TRANSFER_REQUEST_QUERY_KEYS.all,
            });
        },
    });
};
