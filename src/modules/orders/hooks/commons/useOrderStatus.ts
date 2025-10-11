import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ORDER_COMMONS_KEYS } from "../../constants/orderCommonsQuerykeys";
import { orderCommonsService } from "../../services/commons/orderCommons.service";

export const useOrderStatus = () => {
    return useQuery({
        queryKey: ORDER_COMMONS_KEYS.status(),
        queryFn: async () => await orderCommonsService.getOrderStatus(),
        placeholderData: keepPreviousData,
        staleTime: Infinity
    });
};
