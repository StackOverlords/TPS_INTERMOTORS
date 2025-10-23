import { useQuery } from "@tanstack/react-query";
import { transferService } from "../services/transfer.service";
import { TRANSFER_QUERY_KEYS } from "../constants/transferQueryKeys";

export const useTransferById = (id: number) => {
    return useQuery({
        queryKey: TRANSFER_QUERY_KEYS.detail(id),
        queryFn: () => transferService.getById(id),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!id,
    });
};
