import { useQuery, useMutation } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import type {
  ReportMasVendidoFilters,
  ReportMasVendidoResponse,
} from '../types/report.types';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast-enhanced';

export const REPORT_MAS_VENDIDO_QUERY_KEY = 'report-mas-vendido';

export interface UseReportMasVendidoOptions {
  filters: ReportMasVendidoFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte de productos más vendidos (solo datos)
 */
export function useReportMasVendido({ 
  filters, 
  enabled = true 
}: UseReportMasVendidoOptions) {
  // Asegurarnos que downloadable sea false para este hook
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<ReportMasVendidoResponse, Error>({
    queryKey: [REPORT_MAS_VENDIDO_QUERY_KEY, queryFilters],
    queryFn: () => reportService.getMasVendido(queryFilters) as Promise<ReportMasVendidoResponse>,
    enabled: enabled && !!queryFilters.fecha_inicio && !!queryFilters.ranking,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para descargar el reporte en Excel
 */
export function useDownloadReportMasVendido() {

  return useMutation({
    mutationFn: async (filters: ReportMasVendidoFilters) => {
      const downloadFilters = { ...filters, downloadable: true };
      await reportService.getMasVendido(downloadFilters);
    },
    onSuccess: () => {
      showSuccessToast({
        title: 'Descarga exitosa',
        description: 'El reporte se ha descargado correctamente',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      showErrorToast({
        title: 'Error al descargar',
        description: error.message || 'No se pudo descargar el reporte',
        duration: 5000,
      });
    },
  });
}