import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query";
import type {
  StockMinimoFilters,
  StockMinimoReportResponse,
} from "../../types/StockMinimoReport.types";
import { productsService } from "../../services/productService";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

export const useStockMinimoReport = (
  filters: StockMinimoFilters,
  enabled = true,
) => {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<StockMinimoReportResponse, Error>({
    queryKey: ["stock-minimo-report", queryFilters],
    queryFn: () =>
      productsService.getStockMinimoReport({
        filters,
        isDownloadable: false,
      }) as Promise<StockMinimoReportResponse>,
    placeholderData: keepPreviousData,
    enabled: enabled && !!queryFilters.sucursal,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1, // Solo reintentar 1 vez
  });
};

/**
 * Hook para descargar el reporte de stock minimo en Excel
 */
export function useDownloadStockMinimoReport() {
  return useMutation({
    mutationFn: async (filters: StockMinimoFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await productsService.getStockMinimoReport({
        filters: downloadFilters,
        isDownloadable: true,
      })) as Blob;

      const filename = generateExcelFilename("reporte_stock_minimo");
      const saved = await saveExcelFile(blob, filename);

      return saved;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description: "El reporte de stock mínimo se descargó correctamente",
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
