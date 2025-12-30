import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseService } from "../services/purchaseService";
import { PRUCHASE_QUERY_KEYS } from "../constants/purchasesQueryKeys";
import type { PurchaseDetail } from "../types/PurchaseDetail";
import { PRODUCTS_QUERY_KEYS } from "@/lib/queryKeys";

interface UpdatePurchaseVariables {
  id: number;
  data: any;
}

export const usePurchaseUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdatePurchaseVariables) =>
      purchaseService.update(id, data),
    onSuccess: (updatedPurchase: PurchaseDetail, variables) => {
      // Invalidar la query específica de la compra actualizada
      queryClient.invalidateQueries({
        queryKey: PRUCHASE_QUERY_KEYS.detail(variables.id),
      });

      // Invalidar la lista de compras para reflejar cambios
      queryClient.invalidateQueries({
        queryKey: PRUCHASE_QUERY_KEYS.lists(),
      });

      // Opcional: Actualizar el caché directamente con los datos actualizados
      queryClient.setQueryData(
        PRUCHASE_QUERY_KEYS.detail(variables.id),
        updatedPurchase
      );

      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEYS.all
      })
      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEYS.details()
      })
      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEYS.stock({})
      })
    },
  });
};
