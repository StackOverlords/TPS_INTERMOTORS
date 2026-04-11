import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import type { AccountReceivableFilters } from "../types/accountReceivableFilters";
import type { AccountReceivableListResponse } from "../types/accountReceivableListResponse";
import { AccountReceivableListResponseSchema } from "../schemas/accountReceivableResponse.schema";
import { PaymentTypesSchema, TermTypesSchema } from "../schemas/commons.schema";
import type { PaymentTypes, TermTypes } from "../schemas/commons.schema";
import { ACCOUNT_PAYABLE_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "ACCOUNTS_RECEIVABLE_SERVICE";

/**
 * Limpia los filtros condicionales
 * Solo envía los filtros que están activos
 */
const cleanConditionalFilters = (filters: Partial<AccountReceivableFilters>) => {
    const cleanedFilters: any = { ...filters };

    // Si condicion_vencimiento es false o undefined, no enviar tipo_vencimiento
    if (!cleanedFilters.condicion_vencimiento) {
        delete cleanedFilters.tipo_vencimiento;
        delete cleanedFilters.condicion_vencimiento;
    }
    // Si está activo, el backend espera condicion_vencimiento=true

    return cleanedFilters;
};

export const accountsReceivableService = {
    /**
     * Obtener todas las cuentas por cobrar con filtros opcionales
     * @param filters - Filtros opcionales para la consulta
     */
    async getAll(filters: Partial<AccountReceivableFilters>): Promise<AccountReceivableListResponse> {
        const cleanedFilters = cleanConditionalFilters(filters);

        Logger.info("Fetching accounts receivable", { filters: cleanedFilters }, MODULE_NAME);
        const response = await ApiService.get(
            ACCOUNT_PAYABLE_ENDPOINTS.all,
            AccountReceivableListResponseSchema,
            { params: cleanedFilters }
        );
        Logger.info("Accounts receivable fetched successfully", { count: response.data.length }, MODULE_NAME);
        return response as AccountReceivableListResponse;
    },

    /**
     * Obtener tipos de pago disponibles
     */
    async getPaymentTypes(): Promise<PaymentTypes> {
        Logger.info("Fetching payment types", {}, MODULE_NAME);
        const response = await ApiService.get(
            ACCOUNT_PAYABLE_ENDPOINTS.paymentTypes,
            PaymentTypesSchema
        );
        Logger.info("Payment types fetched successfully", {}, MODULE_NAME);
        return response as PaymentTypes;
    },

    /**
     * Obtener tipos de vencimiento disponibles
     */
    async getTermTypes(): Promise<TermTypes> {
        Logger.info("Fetching term types", {}, MODULE_NAME);
        const response = await ApiService.get(
            ACCOUNT_PAYABLE_ENDPOINTS.termTypes,
            TermTypesSchema
        );
        Logger.info("Term types fetched successfully", {}, MODULE_NAME);
        return response as TermTypes;
    },
};
