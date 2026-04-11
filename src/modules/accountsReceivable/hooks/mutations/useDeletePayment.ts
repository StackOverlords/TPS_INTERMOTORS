import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "../../services/paymentService";

interface DeletePaymentParams {
    id_pago: number;
    id_venta: number;
}

export const useDeletePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id_pago }: DeletePaymentParams) => paymentService.deletePayment(id_pago),
        onSuccess: (_data, variables) => {
            // Invalidar la lista de pagos para esa venta
            queryClient.invalidateQueries({
                queryKey: ["accountsReceivable", "payments", variables.id_venta],
            });
            // Invalidar la lista de cuentas por cobrar para refrescar saldos
            queryClient.invalidateQueries({
                queryKey: ["accountsReceivable"],
            });
            // Invalidar reportes de cuentas por cobrar
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
