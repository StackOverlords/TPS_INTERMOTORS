import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import type { CreatePaymentData } from "../schemas/createPayment.schema";
import type { Payment, PaymentListResponse } from "../schemas/payment.schema";
import { PaymentListResponseSchema, PaymentSchema } from "../schemas/payment.schema";
import type { PaymentFilters } from "../schemas/paymentFilters.schema";
import { ACCOUNT_PAYABLE_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "PAYMENT_SERVICE";

export const paymentService = {
    /**
     * Obtener todos los pagos de una venta
     */
    async getPayments(filters: PaymentFilters): Promise<PaymentListResponse> {
        const { id_venta, ...queryParams } = filters;

        Logger.info("Fetching payments", { id_venta, filters: queryParams }, MODULE_NAME);
        const response = await ApiService.get(
            ACCOUNT_PAYABLE_ENDPOINTS.payments(id_venta),
            PaymentListResponseSchema,
            { params: queryParams }
        );
        Logger.info("Payments fetched successfully", { count: response.data.length }, MODULE_NAME);
        return response as PaymentListResponse;
    },

    /**
     * Obtener detalle de un pago específico
     */
    async getPaymentDetail(id_pago: number): Promise<Payment> {
        Logger.info("Fetching payment detail", { id_pago }, MODULE_NAME);
        const response = await ApiService.get(
            ACCOUNT_PAYABLE_ENDPOINTS.showPayment(id_pago),
            PaymentSchema
        );
        Logger.info("Payment detail fetched successfully", {}, MODULE_NAME);
        return response as Payment;
    },

    /**
     * Crear un nuevo pago
     */
    async createPayment(data: CreatePaymentData): Promise<Payment> {
        const { id_venta, ...queryParams } = data;

        Logger.info("Creating payment", { id_venta, queryParams }, MODULE_NAME);

        // id_venta va en el path, el resto en query params
        const response = await ApiService.post(
            ACCOUNT_PAYABLE_ENDPOINTS.createPayment(id_venta),
            PaymentSchema,
            undefined, // No body
            { params: queryParams } // fecha, tipo_pago, monto, comentarios
        );

        Logger.info("Payment created successfully", {}, MODULE_NAME);
        return response as Payment;
    },

    /**
     * Eliminar un pago (soft delete)
     */
    async deletePayment(id_pago: number): Promise<void> {
        Logger.info("Deleting payment", { id_pago }, MODULE_NAME);
        await ApiService.delete(
            ACCOUNT_PAYABLE_ENDPOINTS.deletePayment(id_pago)
        );
        Logger.info("Payment deleted successfully", {}, MODULE_NAME);
    },
};
