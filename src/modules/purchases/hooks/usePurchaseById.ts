import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PRUCHASE_QUERY_KEYS } from "../constants/purchasesQueryKeys";
import { purchaseService } from "../services/purchaseService";

export const usePurchaseById = (id: number) => {
    return useQuery({
        queryKey: PRUCHASE_QUERY_KEYS.detail(id),
        queryFn: () => purchaseService.getById(id),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!id
    });
};
