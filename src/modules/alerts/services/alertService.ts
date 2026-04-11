import apiClient from "@/services/axios";
import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import {
    AlertListResponseSchema,
    type AlertListResponse,
} from "../schemas/alert.schema";
import type { AlertFilters } from "../types/alert";
import { ALERTS_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "ALERT_SERVICE";

export const alertService = {
    /**
     * Obtener listado de alertas (CxP o CxC) con filtros paginados
     *
     * GET /api/v1/accounts-payable/alerts  (tipo_documento=CxP)
     * GET /api/v1/accounts-receivable/alerts (tipo_documento=CxC)
     */
    async getAll(filters: AlertFilters): Promise<AlertListResponse> {
        const { tipo_documento, ...queryParams } = filters;
        const endpoint =
            tipo_documento === "CxC"
                ? ALERTS_ENDPOINTS.cxc.list
                : ALERTS_ENDPOINTS.cxp.list;

        Logger.info("Fetching alerts", { tipo_documento, filters: queryParams }, MODULE_NAME);
        const response = await ApiService.get(
            endpoint,
            AlertListResponseSchema,
            { params: { ...queryParams, tipo_documento } },
        );
        Logger.info("Alerts fetched successfully", { count: response.data.length }, MODULE_NAME);
        return response as AlertListResponse;
    },

    /**
     * Marcar una alerta como leída
     *
     * PATCH /api/v1/accounts-payable/alerts/{id}/read
     * PATCH /api/v1/accounts-receivable/alerts/{id}/read
     *
     * Uses apiClient directly — ApiService does not expose patch.
     */
    async markRead(id: number, tipo_documento: "CxP" | "CxC"): Promise<void> {
        const endpoint =
            tipo_documento === "CxC"
                ? ALERTS_ENDPOINTS.cxc.markRead(id)
                : ALERTS_ENDPOINTS.cxp.markRead(id);

        Logger.info("Marking alert as read", { id, tipo_documento }, MODULE_NAME);
        await apiClient.patch(endpoint);
        Logger.info("Alert marked as read successfully", { id }, MODULE_NAME);
    },

    /**
     * Marcar todas las alertas como leídas para una sucursal y tipo de documento
     *
     * PATCH /api/v1/accounts-payable/alerts/read-all?sucursal={id}&tipo_documento=CxP
     * PATCH /api/v1/accounts-receivable/alerts/read-all?sucursal={id}&tipo_documento=CxC
     *
     * Uses apiClient directly — ApiService does not expose patch.
     */
    async markAllRead(sucursal: number, tipo_documento: "CxP" | "CxC"): Promise<void> {
        const endpoint =
            tipo_documento === "CxC"
                ? ALERTS_ENDPOINTS.cxc.markAllRead
                : ALERTS_ENDPOINTS.cxp.markAllRead;

        Logger.info("Marking all alerts as read", { sucursal, tipo_documento }, MODULE_NAME);
        await apiClient.patch(endpoint, null, { params: { sucursal, tipo_documento } });
        Logger.info("All alerts marked as read successfully", { sucursal, tipo_documento }, MODULE_NAME);
    },
};
