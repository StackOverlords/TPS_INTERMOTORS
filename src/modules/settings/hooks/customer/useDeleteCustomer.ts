import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../../services/customer.service";

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => customersService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
};
