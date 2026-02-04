import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatePaymentData } from "../../schemas/createPayment.schema";
import { paymentService } from "../../services/paymentService";

export const useCreatePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePaymentData) => paymentService.createPayment(data),
        onSuccess: (_data, variables) => {
            // Invalidar la lista de pagos para esa venta
            queryClient.invalidateQueries({
                queryKey: ["accountsPayable", "payments", variables.id_venta],
            });
            // Invalidar la lista de cuentas por cobrar para refrescar saldos
            queryClient.invalidateQueries({
                queryKey: ["accountsPayable"],
            });
            // Invalidar los reportes de cuentas por cobrar también
            queryClient.invalidateQueries({
                queryKey: ["accounts-receivable-general-report"],
            });
            queryClient.invalidateQueries({
                queryKey: ["accounts-receivable-paid-report"],
            });
            queryClient.invalidateQueries({
                queryKey: ["accounts-receivable-by-customer-report"],
            });
        },
    });
};
