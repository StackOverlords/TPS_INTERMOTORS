import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const CashMovementSchema = z.object({
    id: z.number().int(),
    tipo_movimiento: z.enum(['INGRESO', 'EGRESO']),
    concepto: z.enum(['VENTA', 'COBRO_CUENTA', 'INGRESO_MANUAL', 'EGRESO_MANUAL', 'GASTO', 'GASTO_NO_DEDUCIBLE']),
    concepto_label: z.string(),
    origen: z.enum(['AUTOMATICO', 'MANUAL']),
    forma_pago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'QR', 'TARJETA']),
    forma_pago_label: z.string(),
    monto: z.coerce.number(),
    referencia_tipo: z.string().nullable(),
    referencia_id: z.number().int().nullable(),
    tipo_gasto: z.object({
        id: z.number().int(),
        nombre: z.string(),
    }).nullable(),
    descripcion: z.string().nullable(),
    fecha_reg: z.string(),
});

export const CashMovementListResponseSchema = paginatedResponseSchema(CashMovementSchema);

export type CashMovementType = z.infer<typeof CashMovementSchema>;
export type CashMovementListResponse = z.infer<typeof CashMovementListResponseSchema>;
