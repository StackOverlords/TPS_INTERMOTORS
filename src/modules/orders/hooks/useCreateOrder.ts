import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrderCreate } from "../types/orderCreate.types";
import { orderService } from "../services/order.service";
import { ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrderCreate) => orderService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() });
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
