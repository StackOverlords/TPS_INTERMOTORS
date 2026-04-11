import { useQuery } from "@tanstack/react-query";
import { ACCOUNTS_PAYABLE_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpService } from "../../services/cxpService";

/**
 * Hook para obtener los tipos de pago disponibles para CxP
 *
 * staleTime: 1 hora — los tipos de pago no cambian frecuentemente
 */
export const useCxPPaymentTypes = () => {
    return useQuery({
        queryKey: ACCOUNTS_PAYABLE_QUERY_KEYS.paymentTypes(),
        queryFn: () => cxpService.getPaymentTypes(),
        staleTime: 1000 * 60 * 60,
    });
};

/**
 * Hook para obtener los tipos de plazo disponibles para CxP
 *
 * staleTime: 1 hora — los tipos de plazo no cambian frecuentemente
 */
export const useCxPTermTypes = () => {
    return useQuery({
        queryKey: ACCOUNTS_PAYABLE_QUERY_KEYS.termTypes(),
        queryFn: () => cxpService.getTermTypes(),
        staleTime: 1000 * 60 * 60,
    });
};
