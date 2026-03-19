import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { quotationReportsService } from '../../../services/quotationReports.service';
import type {
    QuotationReportTopClientesFilters,
    QuotationReportTopClientesResponse,
} from '../../../types/quotationReports.types';

export const QUOTATION_REPORT_TOP_CLIENTES_QUERY_KEY = 'quotation-report-top-clientes';

interface UseQuotationReportTopClientesOptions {
    filters: QuotationReportTopClientesFilters;
    enabled?: boolean;
}

/**
 * Hook para obtener el reporte de top clientes por cotizaciones
 */
export function useQuotationReportTopClientes({
    filters,
    enabled = true,
}: UseQuotationReportTopClientesOptions) {
    return useQuery<QuotationReportTopClientesResponse, Error>({
        queryKey: [QUOTATION_REPORT_TOP_CLIENTES_QUERY_KEY, filters],
        queryFn: () => quotationReportsService.getTopClientes(filters),
        enabled: enabled && !!filters.fecha_inicio,
        staleTime: 1000 * 60 * 5, // 5 minutos
        placeholderData: keepPreviousData,
        retry: 1,
    });
}
