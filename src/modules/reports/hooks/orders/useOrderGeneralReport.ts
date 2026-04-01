import { useQuery, useMutation } from "@tanstack/react-query";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import type {
  OrderReportGeneralFilters,
  OrderReportGeneralResponse,
} from "../../types/orderReport.types";
import { orderReportService } from "../../services/orderReport.service";

export const ORDER_GENERAL_REPORT_QUERY_KEY = "report-order-general";

export interface UseOrderGeneralReportOptions {
  filters: OrderReportGeneralFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte general de pedidos a proveedores (solo datos JSON).
 */
export function useOrderGeneralReport({
  filters,
  enabled = true,
}: UseOrderGeneralReportOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<OrderReportGeneralResponse, Error>({
    queryKey: [ORDER_GENERAL_REPORT_QUERY_KEY, queryFilters],
    queryFn: () =>
      orderReportService.getGeneral(
        queryFilters,
      ) as Promise<OrderReportGeneralResponse>,
    enabled: enabled && !!queryFilters.fecha_inicio,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para descargar el reporte general de pedidos en Excel.
 */
export function useDownloadOrderGeneralReport() {
  return useMutation({
    mutationFn: async (filters: OrderReportGeneralFilters) => {
      const downloadFilters = { ...filters, downloadable: true };

      const blob = (await orderReportService.getGeneral(
        downloadFilters,
      )) as Blob;

      const filename = generateExcelFilename("reporte_general_pedidos");
      return saveExcelFile(blob, filename);
    },
    onSuccess: (saved) => {
      if (!saved) return;
      showSuccessToast({
        title: "Descarga exitosa",
        description: "El reporte general de pedidos se descargó correctamente",
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
