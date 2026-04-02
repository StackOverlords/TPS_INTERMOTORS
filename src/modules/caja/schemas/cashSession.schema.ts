import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";
import { CashMovementSchema } from "./cashMovement.schema";

const ArqueoFormaPagoSchema = z.object({
    forma_pago: z.string(),
    forma_pago_label: z.string(),
    total_ingresos: z.coerce.number(),
    total_egresos: z.coerce.number(),
    saldo: z.coerce.number(),
});

export const CashSessionArqueoSchema = z.object({
    sesion_id: z.number().int(),
    estado: z.enum(['ABIERTA', 'CERRADA']),
    estado_label: z.string(),
    desglose: z.array(ArqueoFormaPagoSchema),
    total_ingresos: z.coerce.number(),
    total_egresos: z.coerce.number(),
    saldo_sistema: z.coerce.number(),
});

const BranchRefSchema = z.object({
    id: z.number().int(),
    nombre: z.string(),
});

const UserRefSchema = z.object({
    id: z.number().int(),
    name: z.string(),
}).transform(u => ({ id: u.id, nombre: u.name }));

export const CashSessionSchema = z.object({
    id: z.number().int(),
    estado: z.enum(['ABIERTA', 'CERRADA']),
    estado_label: z.string(),
    sucursal: BranchRefSchema,
    usuario_apertura: UserRefSchema,
    usuario_cierre: UserRefSchema.nullish().transform(v => v ?? null),
    fecha_apertura: z.string(),
    fecha_cierre: z.string().nullable(),
    monto_apertura: z.coerce.number(),
    monto_cierre_declarado: z.coerce.number().nullable(),
    monto_cierre_sistema: z.coerce.number().nullable(),
    diferencia: z.coerce.number().nullable(),
    total_ingresos: z.coerce.number(),
    total_egresos: z.coerce.number(),
    saldo_sistema: z.coerce.number(),
    observaciones_apertura: z.string().nullable(),
    observaciones_cierre: z.string().nullable(),
    arqueo_por_forma_pago: z.array(ArqueoFormaPagoSchema).optional(),
    movimientos: z.array(CashMovementSchema).optional().default([]),
    fecha_reg: z.string(),
});

export const CashSessionListResponseSchema = paginatedResponseSchema(CashSessionSchema);

export type CashSessionSchemaType = z.infer<typeof CashSessionSchema>;
export type CashSessionListResponse = z.infer<typeof CashSessionListResponseSchema>;
