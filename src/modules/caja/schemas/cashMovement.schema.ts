import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const CashMovementSchema = z.object({
    id: z.number().int(),
    tipo_movimiento: z.enum(['INGRESO', 'EGRESO']),
    concepto: z.enum([
        // Sesión
        'APERTURA_CAJA',
        // Ingresos
        'VENTA_CONTADO',
        'VENTA_RAPIDA',
        'VENTA_LOCAL',
        'VENTA_MULTIPLE',
        'COBRANZA_CREDITO',
        'ANTICIPO_COTIZACION',
        'INGRESO_MANUAL',
        'ANULACION_DEVOLUCION',
        'ANULACION_INGRESO_MANUAL',
        // Egresos
        'GASTO_NO_DEDUCIBLE',
        'RETIRO_EFECTIVO',
        'PAGO_SERVICIO',
        'DEVOLUCION_CLIENTE',
        'VUELTO',
        'ANULACION_VENTA',
        'ANULACION_VUELTO',
        'ANULACION_COBRANZA',
        'ANULACION_GASTO',
        'ANULACION_RETIRO',
    ]),
    concepto_label: z.string(),
    origen: z.enum(['AUTOMATICO', 'MANUAL']),
    forma_pago: z.enum(['EFECTIVO', 'CHEQUE', 'TRASNF', 'QR', 'QR-EFECT']),
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
