import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ACCOUNTS_PAYABLE_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpPaymentService } from "../../services/cxpPaymentService";
import type { CreateCxPPaymentData } from "../../schemas/cxpPayment.schema";

const useCreateCxPPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCxPPaymentData) => cxpPaymentService.createPayment(data),
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

export default useCreateCxPPayment;
