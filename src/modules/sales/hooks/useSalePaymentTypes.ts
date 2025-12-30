import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { saleCommonsService } from "../services/salesCommonsService";

export const useSalePaymentTypes = () => {
    return useQuery({
        queryKey: ["sale-payment-types"],
        queryFn: async () => await saleCommonsService.getSalePaymentTypes(),
        placeholderData: keepPreviousData,
        staleTime: Infinity
    });
};
