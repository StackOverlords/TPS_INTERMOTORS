import { z } from "zod";

/**
 * Schema para crear un pago
 */
export const CreatePaymentSchema = z.object({
    id_venta: z.number().int(),
    fecha: z.string(), // formato: yyyy-mm-dd
    tipo_pago: z.enum(["EFECTIVO", "CHEQUE", "TRASNF", "QR", "QR-EFECTIVO"]),
    monto: z.number().positive().transform((val) => {
        // Asegurar que siempre tenga exactamente 2 decimales
        return parseFloat(val.toFixed(2));
    }),
    comentarios: z.string().optional(),
});

export type CreatePaymentData = z.infer<typeof CreatePaymentSchema>;
