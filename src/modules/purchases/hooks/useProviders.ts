import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchProviders } from "../services/purchaseCommonsService";
import { PURCHASE_COMMONS_KEYS } from "../constants/purchasesCommonsQuerykeys";

export const useProviders = () => {
    return useQuery({
        queryKey: PURCHASE_COMMONS_KEYS.providers(),
        queryFn: () => fetchProviders(""),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
};
