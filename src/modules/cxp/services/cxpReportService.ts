import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import type { AxiosRequestConfig } from "axios";
import {
    CxPGeneralReportResponseSchema,
    CxPBySupplierReportResponseSchema,
    CxPProjectionReportResponseSchema,
    CxPRankingReportResponseSchema,
    type CxPReportItem,
    type CxPGeneralReportFilter,
    type CxPGeneralReportResponse,
    type CxPBySupplierReportFilter,
    type CxPBySupplierReportResponse,
    type CxPProjectionReportResponse,
    type CxPRankingReportFilter,
    type CxPRankingReportResponse,
} from "../schemas/cxpReport.schema";
import { CXP_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "CXP_REPORT_SERVICE";

/**
 * Configuración para descarga de Excel
 * Mirrors accountsReceivableReportService pattern exactly
 */
const ExcelRequestConfig = (timeout?: number): AxiosRequestConfig => ({
    responseType: "blob",
    headers: {
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    timeout: timeout ?? 120000,
});

export const cxpReportService = {
    /**
     * Reporte general de cuentas por pagar
     * Si downloadable=true, retorna Blob (Excel). Si false, retorna datos JSON.
     *
     * POST /api/v1/accounts-payable/reports/general
     */
    async getGeneralReport(
        filters: CxPGeneralReportFilter & { downloadable?: boolean },
    ): Promise<CxPGeneralReportResponse | Blob> {
        const { downloadable, ...backendFilters } = filters;
        Logger.info("Fetching CxP general report", { filters: backendFilters }, MODULE_NAME);

        if (downloadable) {
            const blob = await ApiService.post(
                CXP_ENDPOINTS.reports.general,
                backendFilters,
                undefined,
                ExcelRequestConfig(180000),
            );
            Logger.info("CxP general report blob fetched successfully", {}, MODULE_NAME);
            return blob as Blob;
        }

        const response = await ApiService.post(
            CXP_ENDPOINTS.reports.general,
            backendFilters,
            CxPGeneralReportResponseSchema,
            { timeout: 120000 },
        );
        Logger.info("CxP general report fetched successfully", { count: (response as CxPReportItem[]).length }, MODULE_NAME);
        return response as CxPGeneralReportResponse;
    },

    /**
     * Reporte por proveedor de cuentas por pagar
     * Si downloadable=true, retorna Blob (Excel). Si false, retorna datos JSON.
     *
     * POST /api/v1/accounts-payable/reports/by-supplier
     */
    async getBySupplierReport(
        filters: CxPBySupplierReportFilter & { downloadable?: boolean },
    ): Promise<CxPBySupplierReportResponse | Blob> {
        const { downloadable, ...backendFilters } = filters;
        Logger.info("Fetching CxP by-supplier report", { filters: backendFilters }, MODULE_NAME);

        if (downloadable) {
            const blob = await ApiService.post(
                CXP_ENDPOINTS.reports.bySupplier,
                backendFilters,
                undefined,
                ExcelRequestConfig(180000),
            );
            Logger.info("CxP by-supplier report blob fetched successfully", {}, MODULE_NAME);
            return blob as Blob;
        }

        const response = await ApiService.post(
            CXP_ENDPOINTS.reports.bySupplier,
            backendFilters,
            CxPBySupplierReportResponseSchema,
            { timeout: 120000 },
        );
        Logger.info("CxP by-supplier report fetched successfully", { count: (response as CxPReportItem[]).length }, MODULE_NAME);
        return response as CxPBySupplierReportResponse;
    },

    /**
     * Reporte de proyección de cuentas por pagar (4 buckets de vencimiento)
     * No tiene variante Excel — siempre retorna JSON.
     *
     * GET /api/v1/accounts-payable/reports/projection?sucursal={id}
     */
    async getProjectionReport(sucursal: number): Promise<CxPProjectionReportResponse> {
        Logger.info("Fetching CxP projection report", { sucursal }, MODULE_NAME);
        const response = await ApiService.get(
            CXP_ENDPOINTS.reports.projection,
            CxPProjectionReportResponseSchema,
            { params: { sucursal } },
        );
        Logger.info("CxP projection report fetched successfully", {}, MODULE_NAME);
        return response as CxPProjectionReportResponse;
    },

    /**
     * Reporte de ranking de proveedores
     * Si downloadable=true, retorna Blob (Excel). Si false, retorna datos JSON.
     *
     * POST /api/v1/accounts-payable/reports/supplier-ranking
     */
    async getSupplierRankingReport(
        filters: CxPRankingReportFilter & { downloadable?: boolean },
    ): Promise<CxPRankingReportResponse | Blob> {
        const { downloadable, ...backendFilters } = filters;
        Logger.info("Fetching CxP supplier ranking report", { filters: backendFilters }, MODULE_NAME);

        if (downloadable) {
            const blob = await ApiService.post(
                CXP_ENDPOINTS.reports.supplierRanking,
                backendFilters,
                undefined,
                ExcelRequestConfig(180000),
            );
            Logger.info("CxP supplier ranking blob fetched successfully", {}, MODULE_NAME);
            return blob as Blob;
        }

        const response = await ApiService.post(
            CXP_ENDPOINTS.reports.supplierRanking,
            backendFilters,
            CxPRankingReportResponseSchema,
            { timeout: 120000 },
        );
        Logger.info("CxP supplier ranking fetched successfully", { count: (response as CxPRankingReportResponse).length }, MODULE_NAME);
        return response as CxPRankingReportResponse;
    },
};
