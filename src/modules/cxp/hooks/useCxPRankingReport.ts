import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query";
import { CXP_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpReportService } from "../services/cxpReportService";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import type {
    CxPRankingReportFilter,
    CxPRankingReportResponse,
} from "../schemas/cxpReport.schema";

/**
 * Hook para obtener el reporte de ranking de proveedores CxP
 *
 * POST /api/v1/accounts-payable/reports/supplier-ranking
 */
const useCxPRankingReport = (
    filters: CxPRankingReportFilter,
    enabled = true,
) => {
    const queryFilters = { ...filters, downloadable: false };

    return useQuery<CxPRankingReportResponse, Error>({
        queryKey: CXP_QUERY_KEYS.reportRanking(queryFilters),
        queryFn: () =>
            cxpReportService.getSupplierRankingReport(queryFilters) as Promise<CxPRankingReportResponse>,
        placeholderData: keepPreviousData,
        enabled: enabled && !!queryFilters.sucursal,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
};

export default useCxPRankingReport;

/**
 * Hook para descargar el reporte de ranking de proveedores en Excel
 */
export const useDownloadCxPRankingReport = () => {
    return useMutation({
        mutationFn: async (filters: CxPRankingReportFilter) => {
            const downloadFilters = { ...filters, downloadable: true };
            const blob = (await cxpReportService.getSupplierRankingReport(downloadFilters)) as Blob;
            const filename = generateExcelFilename("cuentas_por_pagar_ranking_proveedores");
            return saveExcelFile(blob, filename);
        },
        onSuccess: (saved) => {
            if (!saved) return;
            showSuccessToast({
                title: "Descarga exitosa",
                description: "El ranking de proveedores de cuentas por pagar se descargó correctamente",
            });
        },
        onError: (error: Error) => {
            showErrorToast({
                title: "Error al descargar",
                description: error.message || "No se pudo descargar el reporte",
            });
        },
    });
};
