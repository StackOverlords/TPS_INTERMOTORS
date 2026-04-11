import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query";
import { CXP_QUERY_KEYS } from "@/lib/queryKeys";
import { cxpReportService } from "../services/cxpReportService";
import { generateExcelFilename, saveExcelFile } from "@/lib/excelUtils";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import type {
    CxPBySupplierReportFilter,
    CxPBySupplierReportResponse,
} from "../schemas/cxpReport.schema";

/**
 * Hook para obtener el reporte por proveedor de CxP
 *
 * POST /api/v1/accounts-payable/reports/by-supplier
 */
const useCxPBySupplierReport = (
    filters: CxPBySupplierReportFilter,
    enabled = true,
) => {
    const queryFilters = { ...filters, downloadable: false };

    return useQuery<CxPBySupplierReportResponse, Error>({
        queryKey: CXP_QUERY_KEYS.reportBySupplier(queryFilters),
        queryFn: () =>
            cxpReportService.getBySupplierReport(queryFilters) as Promise<CxPBySupplierReportResponse>,
        placeholderData: keepPreviousData,
        enabled: enabled && !!queryFilters.sucursal,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
};

export default useCxPBySupplierReport;

/**
 * Hook para descargar el reporte por proveedor de CxP en Excel
 */
export const useDownloadCxPBySupplierReport = () => {
    return useMutation({
        mutationFn: async (filters: CxPBySupplierReportFilter) => {
            const downloadFilters = { ...filters, downloadable: true };
            const blob = (await cxpReportService.getBySupplierReport(downloadFilters)) as Blob;
            const filename = generateExcelFilename("cuentas_por_pagar_por_proveedor");
            return saveExcelFile(blob, filename);
        },
        onSuccess: (saved) => {
            if (!saved) return;
            showSuccessToast({
                title: "Descarga exitosa",
                description: "El reporte por proveedor de cuentas por pagar se descargó correctamente",
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
