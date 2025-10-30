import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { PurchaseFilters } from "../types/purchaseFilters";
import { cleanUndefined } from "@/utils/zodHelpers";
import { PRUCHASE_QUERY_KEYS } from "../constants/purchasesQueryKeys";
import { purchaseService } from "../services/purchaseService";

export const usePurchasesPaginated = (filters: PurchaseFilters) => {
    const parsedFilters = cleanUndefined(filters);

    const bothOrNoneDates =
        (!!parsedFilters.fecha_inicio && !!parsedFilters.fecha_fin) ||
        (!parsedFilters.fecha_inicio && !parsedFilters.fecha_fin);

    return useQuery({
        queryKey: PRUCHASE_QUERY_KEYS.list(filters),
        queryFn: () => purchaseService.getAll(parsedFilters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!parsedFilters.pagina && !!parsedFilters.pagina_registros && bothOrNoneDates,
    });
};
