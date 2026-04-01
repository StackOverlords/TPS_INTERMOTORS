import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  PurchaseReportMayorCostoFilters,
  PurchaseReportMayorCostoResponse,
} from "../../types/purchaseReport.types";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { purchaseReportService } from "../../services/purchaseReport.service";

export const PURCHASE_REPORT_MAYOR_COSTO_QUERY_KEY =
  "purchase-report-mayor-costo";

export interface UseReportPurchaseMayorCostoOptions {
  filters: PurchaseReportMayorCostoFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el ranking de productos con mayor costo total de compra (solo datos)
 */
export function useReportPurchaseMayorCosto({
  filters,
  enabled = true,
}: UseReportPurchaseMayorCostoOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<PurchaseReportMayorCostoResponse, Error>({
    queryKey: [PURCHASE_REPORT_MAYOR_COSTO_QUERY_KEY, queryFilters],
    queryFn: () =>
      purchaseReportService.getMayorCosto(
        queryFilters,
      ) as Promise<PurchaseReportMayorCostoResponse>,
    enabled: enabled && !!queryFilters.fecha_inicio,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook para descargar el ranking de mayor costo en Excel
 */
export function useDownloadReportPurchaseMayorCosto() {
  return useMutation({
    mutationFn: async (filters: PurchaseReportMayorCostoFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await purchaseReportService.getMayorCosto(
        downloadFilters,
      )) as Blob;

      const filename = generateExcelFilename("reporte_compras_mayor_costo");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description: "El ranking de mayor costo se ha descargado correctamente",
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
