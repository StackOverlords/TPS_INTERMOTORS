import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SaleUpdate } from "../types/saleUpdate.type";
import { salesService } from "../services/salesService";

type UpdateSaleParams = {
  saleId: number;
  data: SaleUpdate;
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ saleId, data }: UpdateSaleParams) =>
      salesService.update(saleId, data),
    onSuccess: (updatedSale, { saleId }) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.setQueryData(["sale-detail", saleId], updatedSale); // Actualiza los detalles de la venta en caché
      // queryClient.invalidateQueries({ queryKey: ["sale-detail", saleId] });
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
