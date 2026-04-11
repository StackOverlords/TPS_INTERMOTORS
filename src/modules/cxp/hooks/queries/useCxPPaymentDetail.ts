import { useQuery } from "@tanstack/react-query";
import { ACCOUNTS_PAYABLE_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpPaymentService } from "../../services/cxpPaymentService";

const useCxPPaymentDetail = (id_pago: number, enabled = true) => {
    return useQuery({
        queryKey: [...ACCOUNTS_PAYABLE_QUERY_KEYS.all, "payment-detail", id_pago],
        queryFn: () => cxpPaymentService.getPaymentDetail(id_pago),
        enabled: enabled && !!id_pago,
    });
};

export default useCxPPaymentDetail;
