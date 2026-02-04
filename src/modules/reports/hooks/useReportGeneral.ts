import { useQuery, useMutation } from '@tanstack/react-query';
import { reportService } from '../services/saleReportService';
import type {
  ReportGeneralFilters,
  ReportGeneralResponse,
} from '../types/report.types';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast-enhanced';
import { generateExcelFilename, saveExcelFile } from '@/lib/excelUtils';

export const REPORT_GENERAL_QUERY_KEY = 'report-general';

export interface UseReportGeneralOptions {
  filters: ReportGeneralFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte general de ventas (solo datos)
 */
export function useReportGeneral({ 
  filters, 
  enabled = true 
}: UseReportGeneralOptions) {
  const queryFilters = { ...filters, downloadable: false };

  return useQuery<ReportGeneralResponse, Error>({
    queryKey: [REPORT_GENERAL_QUERY_KEY, queryFilters],
    queryFn: () => reportService.getGeneral(queryFilters) as Promise<ReportGeneralResponse>,
    enabled: enabled && !!queryFilters.fecha_inicio,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para descargar el reporte en Excel
 */
export function useDownloadReportGeneral() {
  return useMutation({
    mutationFn: async (filters: ReportGeneralFilters) => {
     const downloadFilters = { ...filters, downloadable: true };

      const blob = await reportService.getGeneral(downloadFilters) as Blob;

      const filename = generateExcelFilename('reporte_ventas_general');
      const saved = await saveExcelFile(blob, filename);

      // Retornamos el resultado para que onSuccess lo reciba
      return saved;
    },
    onSuccess: (saved) => {
      // Si el usuario canceló, no mostrar nada
      if (!saved) return;
      showSuccessToast({
        title: 'Descarga exitosa',
        description: 'El reporte general se ha descargado correctamente',
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