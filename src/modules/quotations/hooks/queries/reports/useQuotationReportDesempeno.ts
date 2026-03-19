import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { quotationReportsService } from '../../../services/quotationReports.service';
import type {
    QuotationReportDesempenoFilters,
    QuotationReportDesempenoResponse,
} from '../../../types/quotationReports.types';

export const QUOTATION_REPORT_DESEMPENO_QUERY_KEY = 'quotation-report-desempeno';

interface UseQuotationReportDesempenoOptions {
    filters: QuotationReportDesempenoFilters;
    enabled?: boolean;
}

/**
 * Hook para obtener el reporte de desempeño por responsable
 */
export function useQuotationReportDesempeno({
    filters,
    enabled = true,
}: UseQuotationReportDesempenoOptions) {
    return useQuery<QuotationReportDesempenoResponse, Error>({
        queryKey: [QUOTATION_REPORT_DESEMPENO_QUERY_KEY, filters],
        queryFn: () => quotationReportsService.getDesempeno(filters),
        enabled: enabled && !!filters.fecha_inicio,
        staleTime: 1000 * 60 * 5, // 5 minutos
        placeholderData: keepPreviousData,
        retry: 1,
    });
}
