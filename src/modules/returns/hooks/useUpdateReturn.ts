import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReturnUpdate } from "../types/returnUpdate.types";
import { returnService } from "../services/return.service";
import { RETURN_QUERY_KEYS } from "../constants/returnQueryKeys";

type UpdateParams = {
  id: number;
  data: ReturnUpdate;
};

export const useUpdateReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateParams) => returnService.update(id, data),
    onSuccess: (updated, { id }) => {
      queryClient.invalidateQueries({ queryKey: RETURN_QUERY_KEYS.lists() });
      queryClient.setQueryData(RETURN_QUERY_KEYS.detail(id), updated);
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
