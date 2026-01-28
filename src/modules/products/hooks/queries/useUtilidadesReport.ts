import { useQuery, useMutation } from "@tanstack/react-query";
import { productsService } from "../../services/productService";
import type { UtilidadesFilters } from "../../types/UtilidadesReport.types";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

interface UseUtilidadesReportOptions {
  filters: UtilidadesFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte de utilidades
 */
export function useUtilidadesReport({ filters, enabled = true }: UseUtilidadesReportOptions) {
  return useQuery({
    queryKey: ["utilidades-report", filters],
    queryFn: () => productsService.getUtilidadesReport(filters),
    enabled: enabled && !!filters.fecha_inicio && !!filters.fecha_fin,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para descargar el reporte de utilidades en Excel
 */
export function useDownloadUtilidadesReport() {
  return useMutation({
    mutationFn: (filters: UtilidadesFilters) =>
      productsService.downloadUtilidadesReport(filters),
    onSuccess: (blob) => {
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_utilidades_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

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
