import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Sale } from "../types/sale";
import { salesService } from "../services/salesService";

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Sale) => salesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-sales-stats"] });
      queryClient.invalidateQueries({
        queryKey: ["product-stock"],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-provider-orders"],
      });
      // Invalidar cuentas por cobrar (si la venta es a crédito)
      queryClient.invalidateQueries({
        queryKey: ["accountsPayable"],
      });
      // Invalidar reportes de cuentas por cobrar
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
