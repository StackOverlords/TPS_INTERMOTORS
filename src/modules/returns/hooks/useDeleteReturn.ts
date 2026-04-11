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

      // Invalidar la lista de pagos para esa venta
      queryClient.invalidateQueries({
        queryKey: ["accountsReceivable", "payments"],
      });
      // Invalidar la lista de cuentas por cobrar para refrescar saldos
      queryClient.invalidateQueries({
        queryKey: ["accountsReceivable"],
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
      // Invalidar caja (anular devolución genera ANULACION_DEVOLUCION)
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-session-active"] });
    },
    retry: false,
    networkMode: "offlineFirst",
    gcTime: 1000 * 60 * 3,
  });
};
