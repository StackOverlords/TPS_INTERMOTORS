import { useQuery } from "@tanstack/react-query";
import { useBranchStore } from "@/states/branchStore";
import { TREASURY_QUERY_KEYS } from "@/lib/queryKeys";
import { treasuryService } from "../services/treasuryService";
import type { TreasuryDashboard } from "../schemas/treasury.schema";

/**
 * Hook para obtener el dashboard de tesorería
 *
 * GET /api/v1/treasury/dashboard?sucursal=X
 *
 * Incluye:
 * - Posición neta (posicion_neta < 0 → rojo en UI)
 * - Totales CxP/CxC pendientes
 * - Contadores de alertas: data.alertas.{cxc_pendientes, cxc_vencidas, cxp_pendientes, cxp_vencidas}
 * - Proyecciones CxP y CxC (4 buckets cada una)
 *
 * NOTA: Los contadores de alertas vienen de data.alertas — NO existe endpoint separado de counts.
 * Usar data.alertas para badge counts en lugar de crear un hook separado.
 *
 * @param enabled - Flag para habilitar/deshabilitar la query (útil para refetch manual)
 */
const useTreasuryDashboard = (enabled = true) => {
    const { selectedBranchId } = useBranchStore();
    const sucursal = selectedBranchId ? Number(selectedBranchId) : undefined;

    return useQuery<TreasuryDashboard, Error>({
        queryKey: TREASURY_QUERY_KEYS.dashboard(sucursal),
        queryFn: () => treasuryService.getDashboard(sucursal!),
        enabled: enabled && !!sucursal,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export default useTreasuryDashboard;
