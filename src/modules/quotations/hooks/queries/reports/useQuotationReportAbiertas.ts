import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { quotationReportsService } from '../../../services/quotationReports.service';
import type {
    QuotationReportAbiertasFilters,
    QuotationReportAbiertasResponse,
} from '../../../types/quotationReports.types';

export const QUOTATION_REPORT_ABIERTAS_QUERY_KEY = 'quotation-report-abiertas';

interface UseQuotationReportAbiertasOptions {
    filters: QuotationReportAbiertasFilters;
    enabled?: boolean;
}

/**
 * Hook para obtener el reporte de cotizaciones abiertas
 * Requiere fecha_inicio (obligatorio por el backend)
 */
export function useQuotationReportAbiertas({
    filters,
    enabled = true,
}: UseQuotationReportAbiertasOptions) {
    return useQuery<QuotationReportAbiertasResponse, Error>({
        queryKey: [QUOTATION_REPORT_ABIERTAS_QUERY_KEY, filters],
        queryFn: () => quotationReportsService.getAbiertas(filters),
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutos
        placeholderData: keepPreviousData,
        retry: 1,
    });
}
