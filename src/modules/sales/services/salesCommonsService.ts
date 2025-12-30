import { SALECOMMONS_ENDPOINTS } from "./saleCommonsEndpoints"
import type { SaleTypesList, SaleTypesResponse } from "../types/typeSale.types"
import { SaleTypesResponseSchema } from "../schemas/salesTypes.schema"
import type { SaleModalitiesList } from "../types/modalitiesSale.types"
import type { SaleResponsibleListResponse } from "../types/saleResponsible"
import { SaleResponsibleListResponseSchema } from "../schemas/saleResponsibles.schema"
import type { SaleCustomerListResponse } from "../types/saleCustomer.types"
import { SaleCustomerListResponseSchema } from "../schemas/saleCustomer.schema"
import { Logger } from "@/lib/logger"
import { ApiService } from "@/lib/apiService"

const MODULE_NAME = "SALE_COMMONS_SERVICE";

export const saleCommonsService = {
    /**
     * Obtener tipos de venta
     */
    async getSaleTypes(): Promise<SaleTypesList> {
        Logger.info("Fetching sale types", undefined, MODULE_NAME);

        const response = await ApiService.get(
            SALECOMMONS_ENDPOINTS.types,
            SaleTypesResponseSchema
        );

        Logger.info("Sale types fetched successfully", { count: Object.keys(response).length }, MODULE_NAME);

        return this.convertToOptions(response);
    },

    /**
     * Obtener modalidades de venta
     */
    async getSaleModalities(): Promise<SaleModalitiesList> {
        Logger.info("Fetching sale modalities", undefined, MODULE_NAME);

        // ⚠️ Si tienes un schema para modalidades, cámbialo aquí
        const response = await ApiService.get(
            SALECOMMONS_ENDPOINTS.modalities,
            SaleTypesResponseSchema
        );

        Logger.info("Sale modalities fetched successfully", undefined, MODULE_NAME);

        return this.convertToOptions(response);
    },

    /**
     * Obtener responsables de venta
     */
    async getSaleResponsibles(): Promise<SaleResponsibleListResponse> {
        Logger.info("Fetching sale responsibles", undefined, MODULE_NAME);

        const response = await ApiService.get(
            SALECOMMONS_ENDPOINTS.responsibles,
            SaleResponsibleListResponseSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info("Sale responsibles fetched successfully", { count: response.length }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener clientes de venta
     * @param cliente - Filtro opcional por nombre de cliente
     */
    async getSaleCustomers(cliente?: string): Promise<SaleCustomerListResponse> {
        Logger.info("Fetching sale customers", { cliente }, MODULE_NAME);

        const response = await ApiService.get(
            SALECOMMONS_ENDPOINTS.customers,
            SaleCustomerListResponseSchema,
            { params: cliente ? { cliente } : {} }
        );

        Logger.info("Sale customers fetched successfully", { count: response.data.length }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener los tipos de pago de venta
     */
    async getSalePaymentTypes(): Promise<SaleModalitiesList> {
        Logger.info("Fetching sale payment types", undefined, MODULE_NAME);

        const response = await ApiService.get(
            SALECOMMONS_ENDPOINTS.payment_types,
            SaleTypesResponseSchema
        );

        Logger.info("Sale payment types fetched successfully", undefined, MODULE_NAME);

        return this.convertToOptions(response);
    },

    /**
     * Convertir tipos de venta en opciones para selects
     */
    convertToOptions(saleTypes: SaleTypesResponse): SaleTypesList {
        return Object.entries(saleTypes).map(([code, label]) => ({
            code,
            label
        }));
    },
};