import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { AccountPayableFilters } from "../../types/accountPayableFilters";
import { cleanUndefined } from "@/utils/zodHelpers";
import { accountPayableFiltersSchema } from "../../schemas/accountPayableFilter.schema";
import { accountsPayableService } from "../../services/accountPayableService";

export const useAccountsPayablePaginated = (filters: AccountPayableFilters) => {
    const parsed = accountPayableFiltersSchema.safeParse(filters);
    const parsedFilters = parsed.success ? cleanUndefined(parsed.data) : {};

    return useQuery({
        queryKey: ["accountsPayable", parsedFilters],
        queryFn: async () => await accountsPayableService.getAll(parsedFilters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!parsedFilters?.sucursal,
    });
};
