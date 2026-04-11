import { useQuery } from "@tanstack/react-query";
import { accountsReceivableService } from "../../services/accountReceivableService";

export const usePaymentTypes = () => {
    return useQuery({
        queryKey: ["accountsReceivable", "paymentTypes"],
        queryFn: () => accountsReceivableService.getPaymentTypes(),
        staleTime: 1000 * 60 * 60, // 1 hora - los tipos de pago no cambian frecuentemente
    });
};
