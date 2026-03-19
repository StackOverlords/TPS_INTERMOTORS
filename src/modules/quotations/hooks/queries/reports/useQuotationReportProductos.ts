import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { quotationReportsService } from '../../../services/quotationReports.service';
import type {
    QuotationReportProductosFilters,
    QuotationReportProductosResponse,
} from '../../../types/quotationReports.types';

export const QUOTATION_REPORT_PRODUCTOS_QUERY_KEY = 'quotation-report-productos';

interface UseQuotationReportProductosOptions {
    filters: QuotationReportProductosFilters;
    enabled?: boolean;
}

/**
 * Hook para obtener el reporte de productos más cotizados
 */
export function useQuotationReportProductos({
    filters,
    enabled = true,
}: UseQuotationReportProductosOptions) {
    return useQuery<QuotationReportProductosResponse, Error>({
        queryKey: [QUOTATION_REPORT_PRODUCTOS_QUERY_KEY, filters],
        queryFn: () => quotationReportsService.getProductosCotizados(filters),
        enabled: enabled && !!filters.fecha_inicio,
        staleTime: 1000 * 60 * 5, // 5 minutos
        placeholderData: keepPreviousData,
        retry: 1,
    });
}
