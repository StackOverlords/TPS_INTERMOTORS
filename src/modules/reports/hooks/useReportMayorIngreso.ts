import { useQuery, useMutation } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import type {
  ReportMayorIngresoFilters,
  ReportMayorIngresoResponse,
} from '../types/report.types';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast-enhanced';

export const REPORT_MAYOR_INGRESO_QUERY_KEY = 'report-mayor-ingreso';

export interface UseReportMayorIngresoOptions {
  filters: ReportMayorIngresoFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte de productos con mayor ingreso (solo datos)
 */
export function useReportMayorIngreso({ 
  filters, 
  enabled = true 
}: UseReportMayorIngresoOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<ReportMayorIngresoResponse, Error>({
    queryKey: [REPORT_MAYOR_INGRESO_QUERY_KEY, queryFilters],
    queryFn: () => reportService.getMayorIngreso(queryFilters) as Promise<ReportMayorIngresoResponse>,
    enabled: enabled && !!queryFilters.fecha_inicio && !!queryFilters.ranking,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para descargar el reporte en Excel
 */
export function useDownloadReportMayorIngreso() {
  return useMutation({
    mutationFn: async (filters: ReportMayorIngresoFilters) => {
      const downloadFilters = { ...filters, downloadable: true };
      await reportService.getMayorIngreso(downloadFilters);
    },
    onSuccess: () => {
      showSuccessToast({
        title: 'Descarga exitosa',
        description: 'El reporte de productos con mayor ingreso se ha descargado correctamente',
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