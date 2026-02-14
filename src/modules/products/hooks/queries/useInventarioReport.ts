import {
  useQuery,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import { productsService } from "../../services/productService";
import type {
  InventarioFilters,
  InventarioReportResponse,
} from "../../types/InventarioReport.types";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";

interface UseInventarioReportOptions {
  filters: InventarioFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte general de inventario
 */
export function useInventarioReport({
  filters,
  enabled = true,
}: UseInventarioReportOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<InventarioReportResponse, Error>({
    queryKey: ["inventario-report", queryFilters],
    queryFn: () =>
      productsService.getInventarioReport({
        filters,
        isDownloadable: false,
      }) as Promise<InventarioReportResponse>,
    enabled: enabled && !!queryFilters.fecha,
    staleTime: 1000 * 60 * 5, // 5 minutos
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook para descargar el reporte de inventario en Excel
 */
export function useDownloadInventarioReport() {
  return useMutation({
    mutationFn: async (filters: InventarioFilters) => {
      // No enviar parámetros de paginación para descarga completa
      const { pagina, pagina_registros, ...restFilters } = filters;
      const downloadFilters = { ...restFilters, downloadable: true };

      const blob = (await productsService.getInventarioReport({
        filters: downloadFilters,
        isDownloadable: true,
      })) as Blob;

      const filename = generateExcelFilename("reporte_inventario");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description: "El reporte de inventario se descargó correctamente",
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
