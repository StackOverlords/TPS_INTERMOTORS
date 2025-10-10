import { useQuery } from "@tanstack/react-query";
import { customersService } from "../../services/customer.service";

export const useGetCustomerById = (id: number) => {
    return useQuery({
        queryKey: ["customer", id],
        queryFn: () => customersService.getById(id),
        enabled: !!id && id > 0,
    });
};
