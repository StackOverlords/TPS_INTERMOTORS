import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query";
import type {
  AccountsReceivableGeneralFilters,
  AccountsReceivableReportResponse,
} from "../types/AccountsReceivableReport.types";
import { accountsReceivableReportService } from "../services/accountsReceivableReportService";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

export const useAccountsReceivableGeneralReport = (
  filters: AccountsReceivableGeneralFilters,
  enabled = true,
) => {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<AccountsReceivableReportResponse, Error>({
    queryKey: ["accounts-receivable-general-report", queryFilters],
    queryFn: () =>
      accountsReceivableReportService.getGeneralReport(
        queryFilters,
      ) as Promise<AccountsReceivableReportResponse>,
    placeholderData: keepPreviousData,
    enabled: enabled && !!queryFilters.fecha_inicio && !!queryFilters.fecha_fin,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1, // Solo reintentar 1 vez
  });
};

/**
 * Hook para descargar el reporte general de cuentas por cobrar en Excel
 */
export function useDownloadAccountsReceivableGeneralReport() {
  return useMutation({
    mutationFn: async (filters: AccountsReceivableGeneralFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await accountsReceivableReportService.getGeneralReport(
        downloadFilters,
      )) as Blob;

      const filename = generateExcelFilename("cuentas_por_cobrar_general");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description:
          "El reporte general de cuentas por cobrar se descargó correctamente",
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
