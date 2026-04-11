import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { AccountReceivableFilters } from "../../types/accountReceivableFilters";
import { cleanUndefined } from "@/utils/zodHelpers";
import { accountReceivableFiltersSchema } from "../../schemas/accountReceivableFilter.schema";
import { accountsReceivableService } from "../../services/accountReceivableService";

export const useAccountsReceivablePaginated = (filters: AccountReceivableFilters) => {
    const parsed = accountReceivableFiltersSchema.safeParse(filters);
    const parsedFilters = parsed.success ? cleanUndefined(parsed.data) : {};

    return useQuery({
        queryKey: ["accountsReceivable", parsedFilters],
        queryFn: async () => await accountsReceivableService.getAll(parsedFilters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!parsedFilters?.sucursal,
    });
};
