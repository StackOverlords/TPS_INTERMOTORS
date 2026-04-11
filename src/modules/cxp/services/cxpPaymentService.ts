import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import {
    CxPPaymentSchema,
    CxPPaymentListResponseSchema,
    type CxPPayment,
    type CxPPaymentListResponse,
    type CreateCxPPaymentData,
} from "../schemas/cxpPayment.schema";
import { CXP_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "CXP_PAYMENT_SERVICE";

export const cxpPaymentService = {
    /**
     * Obtener todos los pagos de una compra
     *
     * GET /api/v1/accounts-payable/actions/payments/{id_compra}
     */
    async getPayments(id_compra: number): Promise<CxPPaymentListResponse> {
        Logger.info("Fetching CxP payments", { id_compra }, MODULE_NAME);
        const response = await ApiService.get(
            CXP_ENDPOINTS.payments(id_compra),
            CxPPaymentListResponseSchema,
            { params: { pagina: 1, pagina_registros: 100 } },
        );
        Logger.info("CxP payments fetched successfully", { count: response.data.length }, MODULE_NAME);
        return response as CxPPaymentListResponse;
    },

    /**
     * Obtener detalle de un pago CxP específico
     *
     * GET /api/v1/accounts-payable/actions/payments/{id_pago}/show
     */
    async getPaymentDetail(id_pago: number): Promise<CxPPayment> {
        Logger.info("Fetching CxP payment detail", { id_pago }, MODULE_NAME);
        const response = await ApiService.get(
            CXP_ENDPOINTS.showPayment(id_pago),
            CxPPaymentSchema,
        );
        Logger.info("CxP payment detail fetched successfully", {}, MODULE_NAME);
        return response as CxPPayment;
    },

    /**
     * Crear un nuevo pago para una compra
     *
     * POST /api/v1/accounts-payable/actions/payments/{id_compra}
     */
    async createPayment(data: CreateCxPPaymentData): Promise<CxPPayment> {
        const { id_compra, ...body } = data;
        Logger.info("Creating CxP payment", { id_compra }, MODULE_NAME);
        const response = await ApiService.post(
            CXP_ENDPOINTS.createPayment(id_compra),
            body,
            CxPPaymentSchema,
        );
        Logger.info("CxP payment created successfully", {}, MODULE_NAME);
        return response as CxPPayment;
    },

    /**
     * Eliminar un pago CxP (soft delete)
     *
     * DELETE /api/v1/accounts-payable/actions/payments/{id_pago}
     */
    async deletePayment(id_pago: number): Promise<void> {
        Logger.info("Deleting CxP payment", { id_pago }, MODULE_NAME);
        await ApiService.delete(CXP_ENDPOINTS.deletePayment(id_pago));
        Logger.info("CxP payment deleted successfully", {}, MODULE_NAME);
    },
};
