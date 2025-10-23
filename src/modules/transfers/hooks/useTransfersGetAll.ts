import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { cleanUndefined } from "@/utils/zodHelpers";
import { transferService } from "../services/transfer.service";
import type { TransfersFilters } from "../types/transferFilters.types";
import { TRANSFER_QUERY_KEYS } from "../constants/transferQueryKeys";

export const useTransfersGetAll = (filters: TransfersFilters) => {
    const parsedFilters = cleanUndefined(filters);

    const bothOrNoneDates =
        (!!parsedFilters.fecha_inicio && !!parsedFilters.fecha_fin) ||
        (!parsedFilters.fecha_inicio && !parsedFilters.fecha_fin);

    return useQuery({
        queryKey: TRANSFER_QUERY_KEYS.list(filters),
        queryFn: () => transferService.getAll(parsedFilters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!parsedFilters.pagina && !!parsedFilters.pagina_registros && bothOrNoneDates,
    });
};
