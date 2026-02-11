import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseService } from "../services/purchaseService";
import { PRUCHASE_QUERY_KEYS } from "../constants/purchasesQueryKeys";
import type { PurchaseCreate } from "../schemas/purchaseCreate.schema";

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PurchaseCreate) => purchaseService.create(data),
    onSuccess: () => {
      // Invalidar lista de compras
      queryClient.invalidateQueries({
        queryKey: PRUCHASE_QUERY_KEYS.lists(),
      });

      // Invalidar productos (el stock cambió)
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      queryClient.invalidateQueries({
        queryKey: ["product-stock"],
      });

      queryClient.invalidateQueries({
        queryKey: ["product-provider-orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["product-sales-stats"],
      });

      // Invalidar pedidos si la compra está asociada a un pedido
      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
  });
};