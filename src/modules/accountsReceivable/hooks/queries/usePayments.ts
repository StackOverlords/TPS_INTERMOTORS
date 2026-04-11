import { useQuery } from "@tanstack/react-query";
import type { PaymentFilters } from "../../schemas/paymentFilters.schema";
import { paymentService } from "../../services/paymentService";

export const usePayments = (filters: PaymentFilters, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["accountsReceivable", "payments", filters.id_venta, filters],
        queryFn: () => paymentService.getPayments(filters),
        enabled: enabled && !!filters.id_venta,
    });
};
