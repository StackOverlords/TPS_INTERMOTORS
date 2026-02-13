import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PurchaseUpdate } from "../schemas/purchaseUpdate.schema";
import { purchaseService } from "../services/purchaseService";
import { PRUCHASE_QUERY_KEYS } from "../constants/purchasesQueryKeys";

type UpdatePurchaseParams = {
  purchaseId: number;
  data: PurchaseUpdate;
};

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ purchaseId, data }: UpdatePurchaseParams) =>
      purchaseService.update(purchaseId, data),
    onSuccess: (updatedPurchase, { purchaseId }) => {
      // Invalidar lista de compras
      queryClient.invalidateQueries({
        queryKey: PRUCHASE_QUERY_KEYS.lists(),
      });

      // Actualizar caché del detalle de la compra
      queryClient.setQueryData(
        PRUCHASE_QUERY_KEYS.detail(purchaseId),
        updatedPurchase
      );

      // Invalidar productos (el stock puede haber cambiado)
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
    },
  });
};