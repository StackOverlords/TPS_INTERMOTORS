import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";
import { CashMovementSchema } from "./cashMovement.schema";

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
    usuario_cierre: UserRefSchema.nullable(),
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
    movimientos: z.array(CashMovementSchema).optional().default([]),
    fecha_reg: z.string(),
});

export const CashSessionListResponseSchema = paginatedResponseSchema(CashSessionSchema);

export type CashSessionSchemaType = z.infer<typeof CashSessionSchema>;
export type CashSessionListResponse = z.infer<typeof CashSessionListResponseSchema>;
