import { useQuery } from "@tanstack/react-query";
import { ACCOUNTS_PAYABLE_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpPaymentService } from "../../services/cxpPaymentService";

const useCxPPayments = (id_compra: number, enabled = true) => {
    return useQuery({
        queryKey: ACCOUNTS_PAYABLE_QUERY_KEYS.payments(id_compra),
        queryFn: () => cxpPaymentService.getPayments(id_compra),
        enabled: enabled && !!id_compra,
    });
};

export default useCxPPayments;
