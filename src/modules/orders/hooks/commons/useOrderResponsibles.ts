import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ORDER_COMMONS_KEYS } from "../../constants/orderCommonsQuerykeys";
import { orderCommonsService } from "../../services/commons/orderCommons.service";

export const useOrderResponsibles = () => {
    return useQuery({
        queryKey: ORDER_COMMONS_KEYS.responsibles(),
        queryFn: async () => await orderCommonsService.getOrderResponsibles(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 15
    });
};
