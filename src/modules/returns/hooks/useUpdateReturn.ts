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

      // Invalidar la lista de pagos para esa venta
      queryClient.invalidateQueries({
        queryKey: ["accountsPayable", "payments"],
      });
      // Invalidar la lista de cuentas por cobrar para refrescar saldos
      queryClient.invalidateQueries({
        queryKey: ["accountsPayable"],
      });
      // Invalidar los reportes de cuentas por cobrar también
      queryClient.invalidateQueries({
        queryKey: ["accounts-receivable-general-report"],
      });
      queryClient.invalidateQueries({
        queryKey: ["accounts-receivable-paid-report"],
      });
      queryClient.invalidateQueries({
        queryKey: ["accounts-receivable-by-customer-report"],
      });
    },
  });
};
