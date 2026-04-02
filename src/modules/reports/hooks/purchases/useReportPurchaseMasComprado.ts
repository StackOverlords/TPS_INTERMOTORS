import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  PurchaseReportMasCompradoFilters,
  PurchaseReportMasCompradoResponse,
} from "../../types/purchaseReport.types";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { purchaseReportService } from "../../services/purchaseReport.service";

export const PURCHASE_REPORT_MAS_COMPRADO_QUERY_KEY =
  "purchase-report-mas-comprado";

export interface UseReportPurchaseMasCompradoOptions {
  filters: PurchaseReportMasCompradoFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el ranking de productos más comprados por cantidad (solo datos)
 */
export function useReportPurchaseMasComprado({
  filters,
  enabled = true,
}: UseReportPurchaseMasCompradoOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<PurchaseReportMasCompradoResponse, Error>({
    queryKey: [PURCHASE_REPORT_MAS_COMPRADO_QUERY_KEY, queryFilters],
    queryFn: () =>
      purchaseReportService.getMasComprado(
        queryFilters,
      ) as Promise<PurchaseReportMasCompradoResponse>,
    enabled: enabled && !!queryFilters.fecha_inicio,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook para descargar el ranking de más comprados en Excel
 */
export function useDownloadReportPurchaseMasComprado() {
  return useMutation({
    mutationFn: async (filters: PurchaseReportMasCompradoFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await purchaseReportService.getMasComprado(
        downloadFilters,
      )) as Blob;

      const filename = generateExcelFilename("reporte_compras_mas_comprado");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description:
          "El ranking de más comprados se ha descargado correctamente",
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
