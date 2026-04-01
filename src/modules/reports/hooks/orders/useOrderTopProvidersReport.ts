import { useQuery } from "@tanstack/react-query";
import type {
  OrderReportTopProveedoresFilters,
  OrderReportTopProveedoresResponse,
} from "../../types/orderReport.types";
import { orderReportService } from "../../services/orderReport.service";

export const ORDER_TOP_PROVIDERS_QUERY_KEY = "report-order-top-providers";

export interface UseOrderTopProvidersReportOptions {
  filters: OrderReportTopProveedoresFilters;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte de top proveedores más recurridos en pedidos.
 */
export function useOrderTopProvidersReport({
  filters,
  enabled = true,
}: UseOrderTopProvidersReportOptions) {
  return useQuery<OrderReportTopProveedoresResponse, Error>({
    queryKey: [ORDER_TOP_PROVIDERS_QUERY_KEY, filters],
    queryFn: () => orderReportService.getTopProveedores(filters),
    enabled: enabled && !!filters.fecha_inicio && filters.top_n > 0,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
