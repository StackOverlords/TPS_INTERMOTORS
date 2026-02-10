import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query";
import type {
  AccountsReceivablePaidFilters,
  AccountsReceivableReportResponse,
} from "../types/AccountsReceivableReport.types";
import { accountsReceivableReportService } from "../services/accountsReceivableReportService";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

export const useAccountsReceivablePaidReport = (
  filters: AccountsReceivablePaidFilters,
  enabled = true,
) => {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<AccountsReceivableReportResponse, Error>({
    queryKey: ["accounts-receivable-paid-report", queryFilters],
    queryFn: () =>
      accountsReceivableReportService.getPaidReport(
        queryFilters,
      ) as Promise<AccountsReceivableReportResponse>,
    placeholderData: keepPreviousData,
    enabled:
      enabled && !!queryFilters.pago_fecha_ini && !!queryFilters.pago_fecha_fin,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1, // Solo reintentar 1 vez
  });
};

/**
 * Hook para descargar el reporte de cuentas por cobrar pagadas en Excel
 */
export function useDownloadAccountsReceivablePaidReport() {
  return useMutation({
    mutationFn: async (filters: AccountsReceivablePaidFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await accountsReceivableReportService.getPaidReport(
        downloadFilters,
      )) as Blob;

      const filename = generateExcelFilename("cuentas_por_cobrar_pagadas");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description:
          "El reporte de cuentas por cobrar pagadas se descargó correctamente",
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
