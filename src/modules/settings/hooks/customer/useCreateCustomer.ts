import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../../services/customer.service";

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: customersService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
};
