import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReturnCreate } from "../types/returnCreate.types";
import { returnService } from "../services/return.service";
import { RETURN_QUERY_KEYS } from "../constants/returnQueryKeys";

export const useCreateReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReturnCreate) => returnService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURN_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sale-detail"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-sales-stats"] });
      queryClient.invalidateQueries({
        queryKey: ["product-stock"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-provider-orders"],
      });
    },
  });
};
