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
                queryKey: ["accountsPayable", "payments", variables.id_venta],
            });
            // También invalidar la lista de cuentas por pagar para refrescar saldos
            queryClient.invalidateQueries({
                queryKey: ["accountsPayable", "list"],
            });
        },
    });
};
