import { useQuery, useMutation } from "@tanstack/react-query";
import { productsService } from "../../services/productService";
import type { InventarioFilters } from "../../types/InventarioReport.types";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

interface UseInventarioReportOptions {
  filters: InventarioFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte general de inventario
 */
export function useInventarioReport({ filters, enabled = true }: UseInventarioReportOptions) {
  return useQuery({
    queryKey: ["inventario-report", filters],
    queryFn: () => productsService.getInventarioReport(filters),
    enabled: enabled && !!filters.fecha, // Solo ejecutar si fecha está presente
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para descargar el reporte de inventario en Excel
 */
export function useDownloadInventarioReport() {
  return useMutation({
    mutationFn: (filters: InventarioFilters) =>
      productsService.downloadInventarioReport(filters),
    onSuccess: (blob) => {
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_inventario_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

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
