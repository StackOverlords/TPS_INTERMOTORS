import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ORDER_COMMONS_KEYS } from "../../constants/orderCommonsQuerykeys";
import { orderCommonsService } from "../../services/commons/orderCommons.service";

export const useOrderTypes = () => {
    return useQuery({
        queryKey: ORDER_COMMONS_KEYS.types(),
        queryFn: async () => await orderCommonsService.getOrderTypes(),
        placeholderData: keepPreviousData,
        staleTime: Infinity
    });
};
