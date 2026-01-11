import { useMutation, useQueryClient } from "@tanstack/react-query";
import { returnService } from "../services/return.service";
import { RETURN_QUERY_KEYS } from "../constants/returnQueryKeys";

export const useDeleteReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => returnService.delete(id),
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
    retry: false,
    networkMode: "offlineFirst",
    gcTime: 1000 * 60 * 3,
  });
};
