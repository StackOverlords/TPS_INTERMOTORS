import { useQuery } from "@tanstack/react-query";
import { TRANSFER_REQUEST_QUERY_KEYS } from "../constants/transferRequestQueryKeys";
import { transferRequestService } from "../services/transferRequestService";

export const useTransferRequestById = (id: number | undefined) => {
    return useQuery({
        queryKey: TRANSFER_REQUEST_QUERY_KEYS.detail(id!),
        queryFn: () => transferRequestService.getById(id!),
        staleTime: 0,
        enabled: !!id,
    });
};
