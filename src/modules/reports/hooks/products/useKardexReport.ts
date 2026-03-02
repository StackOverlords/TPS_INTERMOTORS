import { useQuery, useMutation } from "@tanstack/react-query";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { productReportService } from "../../services/productReport.service";
import type {
  KardexReportFilters,
  KardexReportResponse,
} from "../../types/kardexReport.types";

export const KARDEX_REPORT_QUERY_KEY = "report-kardex";

export interface UseKardexReportOptions {
  filters: KardexReportFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte Kardex de productos (solo datos)
 */
export function useKardexReport({
  filters,
  enabled = true,
}: UseKardexReportOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<KardexReportResponse, Error>({
    queryKey: [KARDEX_REPORT_QUERY_KEY, queryFilters],
    queryFn: () =>
      productReportService.getKardexReport(
        queryFilters,
      ) as Promise<KardexReportResponse>,
    enabled: enabled && !!queryFilters.producto,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1, // Solo reintentar 1 vez
  });
}

/**
 * Hook para descargar el reporte en Excel
 */
export function useDownloadKardexReport() {
  return useMutation({
    mutationFn: async (filters: KardexReportFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await productReportService.getKardexReport(
        downloadFilters,
      )) as Blob;

      const filename = generateExcelFilename("reporte_kardex_productos");
      const saved = await saveExcelFile(blob, filename);

      // Retornamos el resultado para que onSuccess lo reciba
      return saved;
    },
    onSuccess: (saved) => {
      // Si el usuario canceló, no mostrar nada
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description:
          "El reporte kardex de productos se ha descargado correctamente",
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
