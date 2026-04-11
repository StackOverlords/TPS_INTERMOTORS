import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ACCOUNTS_PAYABLE_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpPaymentService } from "../../services/cxpPaymentService";

interface DeleteCxPPaymentParams {
    id_pago: number;
    id_compra: number;
}

const useDeleteCxPPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id_pago }: DeleteCxPPaymentParams) =>
            cxpPaymentService.deletePayment(id_pago),
        onSuccess: (_data, variables) => {
            // Invalidar los pagos de esta compra específica
            queryClient.invalidateQueries({
                queryKey: ACCOUNTS_PAYABLE_QUERY_KEYS.payments(variables.id_compra),
            });
            // Invalidar la lista paginada de CxP para refrescar saldos
            queryClient.invalidateQueries({
                queryKey: ACCOUNTS_PAYABLE_QUERY_KEYS.lists(),
            });
        },
    });
};

export default useDeleteCxPPayment;
