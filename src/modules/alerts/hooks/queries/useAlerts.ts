import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useBranchStore } from "@/states/branchStore";
import { ALERTS_QUERY_KEYS } from "@/lib/queryKeys";
import { alertService } from "../../services/alertService";
import type { AlertFilters } from "../../types/alert";

interface UseAlertsParams extends Omit<AlertFilters, "sucursal"> {
    tipo_documento: "CxP" | "CxC";
    tipo_alerta?: "VENCIDA" | "PROXIMA";
    contraparte?: string;
    pagina?: number;
    pagina_registros?: number;
}

/**
 * Hook para obtener la lista paginada de alertas filtrada por tipo_documento (CxP | CxC)
 *
 * GET /api/v1/accounts-payable/alerts  (tipo_documento=CxP)
 * GET /api/v1/accounts-receivable/alerts (tipo_documento=CxC)
 */
const useAlerts = (params: UseAlertsParams) => {
    const { selectedBranchId } = useBranchStore();
    const sucursal = selectedBranchId ? Number(selectedBranchId) : undefined;

    const filters: AlertFilters = {
        ...params,
        sucursal,
    };

    return useQuery({
        queryKey: ALERTS_QUERY_KEYS.list(filters),
        queryFn: () => alertService.getAll(filters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled: !!sucursal,
    });
};

export default useAlerts;
