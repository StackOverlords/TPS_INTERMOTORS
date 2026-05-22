/**
 * DASHBOARD QUERY KEYS — TPS INTERMOTORS
 *
 * Query keys for all dashboard data fetched via TanStack Query.
 * Kept module-local (not in src/lib/queryKeys.ts) because the dashboard module
 * is entirely self-contained and these keys are never invalidated from outside.
 *
 * USO:
 * ```typescript
 * import { DASHBOARD_QUERY_KEYS } from '@/modules/dashboard/constants/dashboardQueryKeys';
 *
 * useQuery({
 *   queryKey: DASHBOARD_QUERY_KEYS.kpis(sucursalId, fechaInicio, fechaFin),
 *   queryFn: () => getKpis({ sucursalId, fechaInicio, fechaFin }),
 * });
 * ```
 */
export const DASHBOARD_QUERY_KEYS = {
  /**
   * Key for the KPIs query — scoped by sucursal + date range.
   * @param sucursalId - ID of the active branch
   * @param fechaInicio - Start date 'YYYY-MM-DD'
   * @param fechaFin - End date 'YYYY-MM-DD'
   * @example DASHBOARD_QUERY_KEYS.kpis(1, '2025-05-01', '2025-05-22')
   */
  kpis: (sucursalId: number, fechaInicio: string, fechaFin: string) =>
    ["dashboard", "kpis", sucursalId, fechaInicio, fechaFin] as const,

  /**
   * Key for the alertas query — scoped by sucursal.
   * staleTime: 5 minutes (alerts don't change every second)
   * @param sucursalId - ID of the active branch
   * @example DASHBOARD_QUERY_KEYS.alertas(1)
   */
  alertas: (sucursalId: number) =>
    ["dashboard", "alertas", sucursalId] as const,

  /**
   * Key for the real-time sales feed — scoped by sucursal.
   * staleTime: 30 seconds + refetchInterval: 30 seconds
   * @param sucursalId - ID of the active branch
   * @example DASHBOARD_QUERY_KEYS.feed(1)
   */
  feed: (sucursalId: number) =>
    ["dashboard", "feed", sucursalId] as const,
} as const;
