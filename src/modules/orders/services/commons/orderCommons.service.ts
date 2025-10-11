import { Logger } from "@/lib/logger"
import { ApiService } from "@/lib/apiService"
import type { OrderModalitiesList, OrderProvidersGetAll, OrderResponsiblesGetAll, OrderStatusList, OrderTypesList } from "../../types/commons/orderCommons.types";
import { ORDERCOMMONS_ENDPOINTS } from "./orderCommonsEndpoints.service";
import { OrderTypesResponseSchema } from "../../schemas/commons/orderTypes.schema";
import { OrderModalitiesResponseSchema } from "../../schemas/commons/orderModalities.schema";
import { OrderResponsiblesGetAllSchema } from "../../schemas/commons/orderResponsibles.schema";
import { OrderProvidersGetAllSchema } from "../../schemas/commons/orderProviders.schema";
import { OrderStatusResponseSchema } from "../../schemas/commons/orderStatus.schema";

const MODULE_NAME = "ORDER_COMMONS_SERVICE";

export const orderCommonsService = {
    /**
     * Obtener tipos del pedido
     */
    async getOrderTypes(): Promise<OrderTypesList> {
        Logger.info("Fetching Order types", undefined, MODULE_NAME);

        const response = await ApiService.get(
            ORDERCOMMONS_ENDPOINTS.types,
            OrderTypesResponseSchema
        );

        Logger.info("Order types fetched successfully", { count: Object.keys(response).length }, MODULE_NAME);

        return this.convertToOptions(response);
    },

    /**
     * Obtener modalidades del pedido
     */
    async getOrderModalities(): Promise<OrderModalitiesList> {
        Logger.info("Fetching Order modalities", undefined, MODULE_NAME);

        const response = await ApiService.get(
            ORDERCOMMONS_ENDPOINTS.modalities,
            OrderModalitiesResponseSchema
        );

        Logger.info("Order modalities fetched successfully", undefined, MODULE_NAME);

        return this.convertToOptions(response);
    },

    /**
     * Obtener responsables del pedido
     */
    async getOrderResponsibles(): Promise<OrderResponsiblesGetAll> {
        Logger.info("Fetching Order responsibles", undefined, MODULE_NAME);

        const response = await ApiService.get(
            ORDERCOMMONS_ENDPOINTS.responsibles,
            OrderResponsiblesGetAllSchema,
            undefined,
        );

        Logger.info("Order responsibles fetched successfully", { count: response.data.length }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener proveedores del pedido
     * @param proveedor - Filtro opcional por nombre de proveedor
     */
    async getOrderProviders(proveedor?: string): Promise<OrderProvidersGetAll> {
        Logger.info("Fetching Order providers", { proveedor }, MODULE_NAME);

        const response = await ApiService.get(
            ORDERCOMMONS_ENDPOINTS.providers,
            OrderProvidersGetAllSchema,
            { params: proveedor ? { proveedor } : {} }
        );

        Logger.info("Order providers fetched successfully", { count: response.data.length }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener estados del pedido
     */
    async getOrderStatus(): Promise<OrderStatusList> {
        Logger.info("Fetching Order status", undefined, MODULE_NAME);

        const response = await ApiService.get(
            ORDERCOMMONS_ENDPOINTS.status,
            OrderStatusResponseSchema
        );

        Logger.info("Order status fetched successfully", undefined, MODULE_NAME);

        return this.convertToOptions(response);
    },

    /**
     * Convertir en opciones para selects
     */
    convertToOptions(data: Record<string, string>) {
        return Object.entries(data).map(([id, label]) => ({
            id,
            label
        }));
    },
};