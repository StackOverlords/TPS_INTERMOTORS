import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useBranchStore } from "@/states/branchStore";
import { CXP_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpReportService } from "../services/cxpReportService";
import type { CxPProjectionReportResponse } from "../schemas/cxpReport.schema";

/**
 * Hook para obtener el reporte de proyección de CxP (4 buckets de vencimiento)
 *
 * GET /api/v1/accounts-payable/reports/projection?sucursal=X
 * No tiene variante Excel — siempre retorna JSON.
 */
const useCxPProjectionReport = (enabled = true) => {
    const { selectedBranchId } = useBranchStore();
    const sucursal = selectedBranchId ? Number(selectedBranchId) : undefined;

    return useQuery<CxPProjectionReportResponse, Error>({
        queryKey: CXP_QUERY_KEYS.reportProjection(sucursal),
        queryFn: () => cxpReportService.getProjectionReport(sucursal!),
        placeholderData: keepPreviousData,
        enabled: enabled && !!sucursal,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
};

export default useCxPProjectionReport;
