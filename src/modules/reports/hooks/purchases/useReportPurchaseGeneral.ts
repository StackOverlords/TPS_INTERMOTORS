import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  PurchaseReportGeneralFilters,
  PurchaseReportGeneralResponse,
} from "../../types/purchaseReport.types";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { purchaseReportService } from "../../services/purchaseReport.service";

export const PURCHASE_REPORT_GENERAL_QUERY_KEY = "purchase-report-general";

export interface UseReportPurchaseGeneralOptions {
  filters: PurchaseReportGeneralFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte general de compras (solo datos)
 */
export function useReportPurchaseGeneral({
  filters,
  enabled = true,
}: UseReportPurchaseGeneralOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<PurchaseReportGeneralResponse, Error>({
    queryKey: [PURCHASE_REPORT_GENERAL_QUERY_KEY, queryFilters],
    queryFn: () =>
      purchaseReportService.getGeneral(
        queryFilters,
      ) as Promise<PurchaseReportGeneralResponse>,
    enabled: enabled && !!queryFilters.fecha_inicio,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook para descargar el reporte general de compras en Excel
 */
export function useDownloadReportPurchaseGeneral() {
  return useMutation({
    mutationFn: async (filters: PurchaseReportGeneralFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await purchaseReportService.getGeneral(
        downloadFilters,
      )) as Blob;

      const filename = generateExcelFilename("reporte_compras_general");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description:
          "El reporte general de compras se ha descargado correctamente",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      showErrorToast({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar el reporte",
        duration: 5000,
      });
    },
  });
}
