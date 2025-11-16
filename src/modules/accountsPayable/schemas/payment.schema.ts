import { z } from "zod";

/**
 * Schema para un pago individual
 */
export const PaymentSchema = z.object({
    id: z.number(),
    nro_pago: z.number(),
    fecha: z.string(),
    tipo_pago: z.string(),
    monto: z.number(),
    comentarios: z.string().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

/**
 * Schema para la respuesta de lista de pagos
 */
export const PaymentListResponseSchema = z.object({
    data: z.array(PaymentSchema),
});

export type Payment = z.infer<typeof PaymentSchema>;
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;
