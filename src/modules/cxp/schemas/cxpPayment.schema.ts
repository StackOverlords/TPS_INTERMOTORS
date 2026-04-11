import { z } from "zod";

/**
 * Schema para un pago de cuentas por pagar individual
 */
export const CxPPaymentSchema = z.object({
    id: z.number(),
    nro_pago: z.number(),
    fecha: z.string(),
    tipo_pago: z.string(),
    monto: z.coerce.number(),
    comentarios: z.string().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

/**
 * Schema para la respuesta de lista de pagos CxP
 */
export const CxPPaymentListResponseSchema = z.object({
    data: z.array(CxPPaymentSchema),
});

/**
 * Schema para crear un pago CxP
 *
 * POST /api/v1/accounts-payable/actions/payments/{id_compra}
 */
export const CreateCxPPaymentSchema = z.object({
    id_compra: z.number().int(),
    proveedor_id: z.number().int(),
    unidad_organizativa_id: z.number().int(),
    fecha: z.string().min(1, "La fecha es requerida"),
    tipo_pago: z.string().min(1, "El tipo de pago es requerido"),
    monto: z
        .number()
        .positive("El monto debe ser mayor a 0")
        .transform((val) => parseFloat(val.toFixed(2))),
    comentarios: z.string().nullable().optional(),
});

export type CxPPayment = z.infer<typeof CxPPaymentSchema>;
export type CxPPaymentListResponse = z.infer<typeof CxPPaymentListResponseSchema>;
export type CreateCxPPaymentData = z.infer<typeof CreateCxPPaymentSchema>;
