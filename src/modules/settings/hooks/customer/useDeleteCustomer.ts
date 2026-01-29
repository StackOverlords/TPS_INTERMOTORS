import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../../services/customer.service";

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => customersService.delete(id),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            // Sales module (select de clientes en ventas, cotizaciones, devoluciones, cuentas por pagar)
            queryClient.invalidateQueries({
                queryKey: ["sale-customers"],
                refetchType: 'active'
            });
        },
    });
};
