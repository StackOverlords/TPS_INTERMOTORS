import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdatePurchaseDetailPricesFormData } from "../types/UpdatePurchaseDetailPrices.types";
import { purchaseService } from "../services/purchaseService";
import { PRUCHASE_QUERY_KEYS } from "../constants/purchasesQueryKeys";

export const useUpdatePurchaseDetailPrices = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdatePurchaseDetailPricesFormData>({
    mutationFn: async (data: UpdatePurchaseDetailPricesFormData) => {
      return purchaseService.updatePurchaseDetailPrices(data);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-detail"] });
      queryClient.invalidateQueries({ queryKey: PRUCHASE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRUCHASE_QUERY_KEYS.details() });
      queryClient.invalidateQueries({
        queryKey: ["product-stock"],
      });
    },
  });
};
