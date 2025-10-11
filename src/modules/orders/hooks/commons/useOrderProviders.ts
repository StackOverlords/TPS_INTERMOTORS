import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { orderCommonsService } from "../../services/commons/orderCommons.service";
import { ORDER_COMMONS_KEYS } from "../../constants/orderCommonsQuerykeys";

export const useOrderProvider = (proveedor?: string) => {
    return useQuery({
        queryKey: ORDER_COMMONS_KEYS.providers(proveedor),
        queryFn: async () => await orderCommonsService.getOrderProviders(proveedor),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
};
