import { useQuery, useMutation } from "@tanstack/react-query";
import { productsService } from "../../services/productService";
import type {
  UtilidadesFilters,
  UtilidadesReportResponse,
} from "../../types/UtilidadesReport.types";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";

interface UseUtilidadesReportOptions {
  filters: UtilidadesFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte de utilidades
 */
export function useUtilidadesReport({
  filters,
  enabled = true,
}: UseUtilidadesReportOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<UtilidadesReportResponse, Error>({
    queryKey: ["utilidades-report", queryFilters],
    queryFn: () =>
      productsService.getUtilidadesReport({
        filters,
        isDownloadable: false,
      }) as Promise<UtilidadesReportResponse>,
    enabled: enabled && !!filters.fecha_inicio && !!filters.fecha_fin,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para descargar el reporte de utilidades en Excel
 */
export function useDownloadUtilidadesReport() {
  return useMutation({
    mutationFn: async (filters: UtilidadesFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await productsService.getUtilidadesReport({
        filters: downloadFilters,
        isDownloadable: true,
      })) as Blob;

      const filename = generateExcelFilename("reporte_utilidades");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;

      showSuccessToast({
        title: "Descarga exitosa",
        description: "El reporte de utilidades se descargó correctamente",
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
