import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { cleanUndefined } from "@/utils/zodHelpers";
import type { ReturnsFilters } from "../types/returnFilters.types";
import { RETURN_QUERY_KEYS } from "../constants/returnQueryKeys";
import { returnService } from "../services/return.service";

export const useReturnsGetAll = (filters: ReturnsFilters) => {
    const parsedFilters = cleanUndefined(filters);

    const bothOrNoneDates =
        (!!parsedFilters.fecha_inicio && !!parsedFilters.fecha_fin) ||
        (!parsedFilters.fecha_inicio && !parsedFilters.fecha_fin);

    return useQuery({
        queryKey: RETURN_QUERY_KEYS.list(filters),
        queryFn: () => returnService.getAll(parsedFilters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!parsedFilters.pagina && !!parsedFilters.pagina_registros && bothOrNoneDates,
    });
};