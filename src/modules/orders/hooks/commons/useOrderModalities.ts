import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { orderCommonsService } from "../../services/commons/orderCommons.service";
import { ORDER_COMMONS_KEYS } from "../../constants/orderCommonsQuerykeys";

export const useOrderModalities = () => {
    return useQuery({
        queryKey: ORDER_COMMONS_KEYS.modalities(),
        queryFn: async () => await orderCommonsService.getOrderModalities(),
        placeholderData: keepPreviousData,
        staleTime: Infinity
    });
};
