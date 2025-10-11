import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { orderService } from "../services/order.service";
import { ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";

export const useGetOrderById = (id: number) => {
    return useQuery({
        queryKey: ORDER_QUERY_KEYS.detail(id),
        queryFn: async () => await orderService.getById(id),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!id
    });
};
