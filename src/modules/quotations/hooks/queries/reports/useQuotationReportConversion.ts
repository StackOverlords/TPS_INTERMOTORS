import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { quotationReportsService } from '../../../services/quotationReports.service';
import type {
    QuotationReportConversionFilters,
    QuotationReportConversionResponse,
} from '../../../types/quotationReports.types';

export const QUOTATION_REPORT_CONVERSION_QUERY_KEY = 'quotation-report-conversion';

interface UseQuotationReportConversionOptions {
    filters: QuotationReportConversionFilters;
    enabled?: boolean;
}

/**
 * Hook para obtener el reporte de conversión de cotizaciones
 */
export function useQuotationReportConversion({
    filters,
    enabled = true,
}: UseQuotationReportConversionOptions) {
    return useQuery<QuotationReportConversionResponse, Error>({
        queryKey: [QUOTATION_REPORT_CONVERSION_QUERY_KEY, filters],
        queryFn: () => quotationReportsService.getConversion(filters),
        enabled: enabled && !!filters.fecha_inicio,
        staleTime: 1000 * 60 * 5, // 5 minutos
        placeholderData: keepPreviousData,
        retry: 1,
    });
}
