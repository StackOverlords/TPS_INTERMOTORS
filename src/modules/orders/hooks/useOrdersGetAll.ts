import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { cleanUndefined } from "@/utils/zodHelpers";
import type { OrdersFilters } from "../types/orderFilters.types";
import { ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";
import { orderService } from "../services/order.service";

export const useOrdersGetAll = (filters: OrdersFilters) => {
    const parsedFilters = cleanUndefined(filters);

    const bothOrNoneDates =
        (!!parsedFilters.fecha_inicio && !!parsedFilters.fecha_fin) ||
        (!parsedFilters.fecha_inicio && !parsedFilters.fecha_fin);

    return useQuery({
        queryKey: ORDER_QUERY_KEYS.list(filters),
        queryFn: () => orderService.getAll(parsedFilters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!parsedFilters.pagina && !!parsedFilters.pagina_registros && bothOrNoneDates,
    });
};