import { useQuery } from "@tanstack/react-query";
import { useBranchStore } from "@/states/branchStore";
import { DASHBOARD_QUERY_KEYS } from "@/modules/dashboard/constants/dashboardQueryKeys";
import { getFeed } from "@/modules/dashboard/services/dashboardService";
import type { FeedResponse } from "@/modules/dashboard/types/dashboard.types";

/**
 * Hook para obtener el feed de ventas en tiempo real.
 *
 * GET /dashboard/feed?sucursal_id=
 *
 * - No params — always shows today's sales for the active branch.
 * - Scoped by the active branch (branchStore).
 * - staleTime: 30 seconds — short window to keep displayed data fresh.
 * - refetchInterval: 30 seconds — auto-refresh for real-time feel.
 * - enabled: only fetches when a branch is selected.
 */
export const useDashboardFeed = () => {
  const { selectedBranchId } = useBranchStore();
  const sucursal = selectedBranchId ? Number(selectedBranchId) : undefined;

  return useQuery<FeedResponse, Error>({
    queryKey: DASHBOARD_QUERY_KEYS.feed(sucursal!),
    queryFn: () => getFeed({ sucursalId: sucursal! }),
    staleTime: 30_000,      // 30 seconds
    refetchInterval: 30_000, // auto-refresh every 30 seconds
    enabled: !!sucursal,
  });
};
