import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { CxPListResponseSchema, type CxPListResponse } from "../schemas/cxpList.schema";
import { CxPPaymentTypesSchema, CxPTermTypesSchema, type CxPPaymentTypes, type CxPTermTypes } from "../schemas/cxpCommons.schema";
import type { CxPFilters } from "../schemas/cxpFilters.schema";
import { CXP_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "CXP_SERVICE";

export const cxpService = {
    /**
     * Obtener lista paginada de cuentas por pagar con filtros opcionales
     *
     * GET /api/v1/account-payable
     */
    async getAll(filters: Partial<CxPFilters>): Promise<CxPListResponse> {
        Logger.info("Fetching CxP list", { filters }, MODULE_NAME);
        const response = await ApiService.get(
            CXP_ENDPOINTS.all,
            CxPListResponseSchema,
            { params: filters },
        );
        Logger.info("CxP list fetched successfully", { count: response.data.length }, MODULE_NAME);
        return response as CxPListResponse;
    },

    /**
     * Obtener tipos de pago disponibles para CxP
     *
     * GET /api/v1/accounts-payable/commons/payment-types
     */
    async getPaymentTypes(): Promise<CxPPaymentTypes> {
        Logger.info("Fetching CxP payment types", {}, MODULE_NAME);
        const response = await ApiService.get(CXP_ENDPOINTS.paymentTypes, CxPPaymentTypesSchema);
        Logger.info("CxP payment types fetched successfully", {}, MODULE_NAME);
        return response as CxPPaymentTypes;
    },

    /**
     * Obtener tipos de plazo disponibles para CxP
     *
     * GET /api/v1/accounts-payable/commons/term-types
     */
    async getTermTypes(): Promise<CxPTermTypes> {
        Logger.info("Fetching CxP term types", {}, MODULE_NAME);
        const response = await ApiService.get(CXP_ENDPOINTS.termTypes, CxPTermTypesSchema);
        Logger.info("CxP term types fetched successfully", {}, MODULE_NAME);
        return response as CxPTermTypes;
    },
};
