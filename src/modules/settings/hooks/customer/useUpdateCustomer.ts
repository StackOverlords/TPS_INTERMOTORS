import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../../services/customer.service";
import type { UpdateCustomer } from "../../types/customer.types";

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCustomer }) =>
            customersService.update(id, data),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["customer"] });
            // Sales module (select de clientes en ventas, cotizaciones, devoluciones, cuentas por pagar)
            queryClient.invalidateQueries({ queryKey: ["sale-customers"] });
        },
    });
};
