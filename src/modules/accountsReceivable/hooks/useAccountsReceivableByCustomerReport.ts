import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query";
import type {
  AccountsReceivableByCustomerFilters,
  AccountsReceivableReportResponse,
} from "../types/AccountsReceivableReport.types";
import { accountsReceivableReportService } from "../services/accountsReceivableReportService";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

export const useAccountsReceivableByCustomerReport = (
  filters: AccountsReceivableByCustomerFilters,
  enabled = true,
) => {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<AccountsReceivableReportResponse, Error>({
    queryKey: ["accounts-receivable-by-customer-report", queryFilters],
    queryFn: () =>
      accountsReceivableReportService.getByCustomerReport(
        queryFilters,
      ) as Promise<AccountsReceivableReportResponse>,
    placeholderData: keepPreviousData,
    enabled:
      enabled &&
      !!queryFilters.fecha_inicio &&
      !!queryFilters.fecha_fin &&
      !!queryFilters.cliente,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1, // Solo reintentar 1 vez
  });
};

/**
 * Hook para descargar el reporte de cuentas por cobrar por cliente en Excel
 */
export function useDownloadAccountsReceivableByCustomerReport() {
  return useMutation({
    mutationFn: async (filters: AccountsReceivableByCustomerFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await accountsReceivableReportService.getByCustomerReport(
        downloadFilters,
      )) as Blob;

      const filename = generateExcelFilename("cuentas_por_cobrar_por_cliente");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description:
          "El reporte de cuentas por cobrar por cliente se descargó correctamente",
      });
    },
    onError: (error: Error) => {
      showErrorToast({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar el reporte",
      });
    },
  });
}
