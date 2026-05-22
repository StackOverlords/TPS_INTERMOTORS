import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth } from "date-fns";
import { useBranchStore } from "@/states/branchStore";
import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/constants/dashboardQueryKeys";
import { getKpis } from "@/modules/dashboard/services/dashboardService";
import type { KpisResponse } from "@/modules/dashboard/types/dashboard.types";

interface UseDashboardKpisParams {
  fechaInicio?: string; // 'YYYY-MM-DD' — defaults to first day of current month
  fechaFin?: string;    // 'YYYY-MM-DD' — defaults to today
}

/**
 * Hook para obtener los KPIs del dashboard.
 *
 * GET /dashboard/kpis?sucursal_id=&fecha_inicio=&fecha_fin=
 *
 * - Scoped by the active branch (branchStore).
 * - Accepts optional date range; defaults to current month when not provided.
 * - staleTime: 1 minute — KPIs change frequently but not every second.
 * - enabled: only fetches when a branch is selected.
 */
export const useDashboardKpis = (params: UseDashboardKpisParams = {}) => {
  const { selectedBranchId } = useBranchStore();
  const sucursal = selectedBranchId ? Number(selectedBranchId) : undefined;

  // Default to current month range when not provided by the caller
  const fechaInicio = params.fechaInicio ?? format(startOfMonth(new Date()), "yyyy-MM-dd");
  const fechaFin = params.fechaFin ?? format(new Date(), "yyyy-MM-dd");

  return useQuery<KpisResponse, Error>({
    queryKey: DASHBOARD_QUERY_KEYS.kpis(sucursal!, fechaInicio, fechaFin),
    queryFn: () =>
      getKpis({ sucursalId: sucursal!, fechaInicio, fechaFin }),
    staleTime: 60_000, // 1 minute
    enabled: !!sucursal,
  });
};
