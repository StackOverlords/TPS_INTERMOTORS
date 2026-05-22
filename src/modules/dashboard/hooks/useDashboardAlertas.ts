import { useQuery } from "@tanstack/react-query";
import { useBranchStore } from "@/states/branchStore";
import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/constants/dashboardQueryKeys";
import { getAlertas } from "@/modules/dashboard/services/dashboardService";
import type { AlertasResponse } from "@/modules/dashboard/types/dashboard.types";

/**
 * Hook para obtener las alertas del dashboard.
 *
 * GET /dashboard/alertas?sucursal_id=
 *
 * - No date params — alerts always reflect current state.
 * - Scoped by the active branch (branchStore).
 * - staleTime: 5 minutes — alerts are relatively stable; no need to refetch often.
 * - enabled: only fetches when a branch is selected.
 */
export const useDashboardAlertas = () => {
  const { selectedBranchId } = useBranchStore();
  const sucursal = selectedBranchId ? Number(selectedBranchId) : undefined;

  return useQuery<AlertasResponse, Error>({
    queryKey: DASHBOARD_QUERY_KEYS.alertas(sucursal!),
    queryFn: () => getAlertas({ sucursalId: sucursal! }),
    staleTime: 300_000, // 5 minutes
    enabled: !!sucursal,
  });
};
