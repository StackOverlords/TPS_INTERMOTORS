import { useQuery, useMutation } from '@tanstack/react-query';
import { reportService } from '../services/saleReportService';
import type {
  ReportMayorIngresoFilters,
  ReportMayorIngresoResponse,
} from '../types/report.types';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast-enhanced';
import { generateExcelFilename, saveExcelFile } from '@/lib/excelUtils';

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

      const blob = await reportService.getMayorIngreso(downloadFilters) as Blob;

      const filename = generateExcelFilename('productos_con_mayor_ingreso');
       const saved = await saveExcelFile(blob, filename);

      // Retornamos el resultado para que onSuccess lo reciba
      return saved;
    },
    onSuccess: (saved) => {
      // Si el usuario canceló, no mostrar nada
      if (!saved) return;
      
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