import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/salesService";

export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idSale: number) => salesService.delete(idSale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-detail"] });
      queryClient.invalidateQueries({
        queryKey: ["product-detail-with-stock"],
      });
      queryClient.invalidateQueries({ queryKey: ["product-sales-stats"] });
      queryClient.invalidateQueries({
        queryKey: ["product-stock"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-provider-orders"],
      });
      // Anular una venta convertida reabre su cotización-pedido (convertida=false):
      // refrescar cotizaciones para que el pedido reaparezca disponible.
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      // La anulación reversa movimientos de caja (saldo).
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-session-active"] });
    },
    retry: false,
    networkMode: "offlineFirst",
    gcTime: 1000 * 60 * 3,
  });
};
