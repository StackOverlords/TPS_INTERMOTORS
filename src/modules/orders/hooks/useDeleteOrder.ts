import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/order.service";
import { ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => orderService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() });
        },
        retry: false,
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 3,
    });
};