import { useMutation } from "@tanstack/react-query";
import { returnService } from "../services/return.service";
import { queryClient } from "@/lib/reactQueryConfig";

export const useDeleteReturnDetail = () => {
  // const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idDetail: number) => returnService.deleteDetail(idDetail),
    onSuccess: () => {
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
    },
    retry: false,
    networkMode: "offlineFirst",
    gcTime: 1000 * 60 * 3,
  });
};
