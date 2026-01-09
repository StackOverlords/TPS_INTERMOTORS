import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrderUpdate } from "../types/orderUpdate.types";
import { orderService } from "../services/order.service";
import { ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";

type UpdateOrderParams = {
  id: number;
  data: OrderUpdate;
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateOrderParams) =>
      orderService.update(id, data),
    onSuccess: (updated, { id }) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() });
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(id), updated);
      queryClient.invalidateQueries({
        queryKey: ["product-stock"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-provider-orders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-sales-stats"],
      });
    },
  });
};
