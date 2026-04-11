import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query";
import { CXP_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpReportService } from "../services/cxpReportService";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import type {
    CxPGeneralReportFilter,
    CxPGeneralReportResponse,
} from "../schemas/cxpReport.schema";

/**
 * Hook para obtener el reporte general de CxP
 *
 * POST /api/v1/accounts-payable/reports/general
 */
const useCxPGeneralReport = (
    filters: CxPGeneralReportFilter,
    enabled = true,
) => {
    const queryFilters = { ...filters, downloadable: false };

    return useQuery<CxPGeneralReportResponse, Error>({
        queryKey: CXP_QUERY_KEYS.reportGeneral(queryFilters),
        queryFn: () =>
            cxpReportService.getGeneralReport(queryFilters) as Promise<CxPGeneralReportResponse>,
        placeholderData: keepPreviousData,
        enabled: enabled && !!queryFilters.fecha_inicio && !!queryFilters.fecha_fin,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
};

export default useCxPGeneralReport;

/**
 * Hook para descargar el reporte general de CxP en Excel
 */
export const useDownloadCxPGeneralReport = () => {
    return useMutation({
        mutationFn: async (filters: CxPGeneralReportFilter) => {
            const downloadFilters = { ...filters, downloadable: true };
            const blob = (await cxpReportService.getGeneralReport(downloadFilters)) as Blob;
            const filename = generateExcelFilename("cuentas_por_pagar_general");
            return saveExcelFile(blob, filename);
        },
        onSuccess: (saved) => {
            if (!saved) return;
            showSuccessToast({
                title: "Descarga exitosa",
                description: "El reporte general de cuentas por pagar se descargó correctamente",
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
