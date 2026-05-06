import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useBranchStore } from "@/states/branchStore";
import { ACCOUNTS_PAYABLE_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpService } from "../../services/cxpService";
import type { CxPFilters } from "../../schemas/cxpFilters.schema";

export interface CxPPaginatedFilters
    extends Omit<Partial<CxPFilters>, "sucursal"> {
    proveedor?: number | null;
    fecha_inicio?: string;
    fecha_fin?: string;
    pagina?: number;
    pagina_registros?: number;
    estado_pago?: "PAGADO" | "DEUDA";
    tipo_vencimiento?: string;
    fecha_vencimiento_regla?: ">=" | "<=" | "=";
    fecha_vencimiento?: string;
}

const useCxPPaginated = (filters: CxPPaginatedFilters = {}) => {
    const { selectedBranchId } = useBranchStore();
    const sucursal = selectedBranchId ? Number(selectedBranchId) : undefined;

    const mergedFilters: Partial<CxPFilters> = {
        ...filters,
        sucursal,
        ...(filters.tipo_vencimiento ? { condicion_vencimiento: true } : {}),
        ...(filters.fecha_vencimiento ? { condicion_fecha_especifica: true } : {}),
    };

    return useQuery({
        queryKey: ACCOUNTS_PAYABLE_QUERY_KEYS.list(mergedFilters),
        queryFn: () => cxpService.getAll(mergedFilters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!sucursal,
    });
};

export default useCxPPaginated;
