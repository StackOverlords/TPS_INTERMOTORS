import { useQuery } from "@tanstack/react-query";
import { accountsPayableService } from "../../services/accountPayableService";

export const usePaymentTypes = () => {
    return useQuery({
        queryKey: ["accountsPayable", "paymentTypes"],
        queryFn: () => accountsPayableService.getPaymentTypes(),
        staleTime: 1000 * 60 * 60, // 1 hora - los tipos de pago no cambian frecuentemente
    });
};
