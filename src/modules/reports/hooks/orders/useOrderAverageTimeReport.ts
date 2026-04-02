import { useQuery } from "@tanstack/react-query";
import type {
  OrderReportTiempoMedioFilters,
  OrderReportTiempoMedioResponse,
} from "../../types/orderReport.types";
import { orderReportService } from "../../services/orderReport.service";

export const PLACEORDER_AVERAGE_TIME_QUERY_KEY = "report-order-average-time";

export interface UseOrderAverageTimeReportOptions {
  filters: OrderReportTiempoMedioFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte de tiempo medio de entrega por proveedor.
 */
export function useOrderAverageTimeReport({
  filters,
  enabled = true,
}: UseOrderAverageTimeReportOptions) {
  return useQuery<OrderReportTiempoMedioResponse, Error>({
    queryKey: [PLACEORDER_AVERAGE_TIME_QUERY_KEY, filters],
    queryFn: () => orderReportService.getTiempoMedio(filters),
    enabled: enabled && !!filters.fecha_inicio,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
