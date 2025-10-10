import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../../services/customer.service";
import type { UpdateCustomer } from "../../types/customer.types";

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCustomer }) =>
            customersService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["customer"] });
        },
    });
};
