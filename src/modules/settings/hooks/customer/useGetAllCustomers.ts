import { useQuery } from "@tanstack/react-query";
import { customersService } from "../../services/customer.service";
import type { CustomerFilters } from "../../types/customer.types";

export const useGetAllCustomers = (filters: Partial<CustomerFilters>) => {
    return useQuery({
        queryKey: ["customers", filters],
        queryFn: () => customersService.getAll(filters),
    });
};
