import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { quotationReportsService } from '../../../services/quotationReports.service';
import type {
    QuotationReportGeneralFilters,
    QuotationReportGeneralResponse,
} from '../../../types/quotationReports.types';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast-enhanced';
import { generateExcelFilename, saveExcelFile } from '@/lib/excelUtils';

export const QUOTATION_REPORT_GENERAL_QUERY_KEY = 'quotation-report-general';

interface UseQuotationReportGeneralOptions {
    filters: QuotationReportGeneralFilters;
    enabled?: boolean;
}

/**
 * Hook para obtener el reporte general de cotizaciones (solo datos)
 */
export function useQuotationReportGeneral({
    filters,
    enabled = true,
}: UseQuotationReportGeneralOptions) {
    const queryFilters = { ...filters, exportar: false };

    return useQuery<QuotationReportGeneralResponse, Error>({
        queryKey: [QUOTATION_REPORT_GENERAL_QUERY_KEY, queryFilters],
        queryFn: () =>
            quotationReportsService.getGeneral(queryFilters) as Promise<QuotationReportGeneralResponse>,
        enabled: enabled && !!queryFilters.fecha_inicio,
        staleTime: 1000 * 60 * 5, // 5 minutos
        placeholderData: keepPreviousData,
        retry: 1,
    });
}

/**
 * Hook para descargar el reporte general de cotizaciones en Excel
 */
export function useDownloadQuotationReportGeneral() {
    return useMutation({
        mutationFn: async (filters: QuotationReportGeneralFilters) => {
            const downloadFilters = { ...filters, exportar: true };

            const blob = await quotationReportsService.getGeneral(downloadFilters) as Blob;

            const filename = generateExcelFilename('reporte_cotizaciones_general');
            const saved = await saveExcelFile(blob, filename);

            return saved;
        },
        onSuccess: (saved) => {
            if (!saved) return;
            showSuccessToast({
                title: 'Descarga exitosa',
                description: 'El reporte general de cotizaciones se descargó correctamente',
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
