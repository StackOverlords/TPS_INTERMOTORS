import { moneySchema, requiredMoneySchema, toNumber, toNumberOrNull, toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import z from "zod";

const ResponsableSchema = z.object({
    apellido_materno: z.string().nullable(),
    apellido_paterno: z.string().nullable(),
    celular: z.string().nullable(),
    dni: z.number().nullable(),
    id: z.number(),
    nombre: z.string(),
});

export const ReturnDetailGetByIdSchema = z.object({
    id: z.number(),
    cantidad: requiredMoneySchema,
    costo: moneySchema,
    moneda: z.string(),
    comentario: z.string().nullable(),
    almacen_out_dev_id: z.number().int().positive(),
    almacen_out_det_id: z.number().int().positive(),
    orden: toNumberOrNull,
    id_venta: z.number().nullable(),
    producto: z.string().nullable(),
    cantidad_maxima: toNumberOrZeroStrict,
})

export const ReturnByIdSchema = z.object({
    id: z.number(),
    // fecha: z.coerce.date(),
    fecha: z.string(),
    nro: z.number(),
    forma_devolucion: z.string(),
    comprobante: z.string().nullable(),
    comentarios: z.string().nullable(),
    responsable: ResponsableSchema.nullable(),
    cantidad_detalles: toNumber,
    detalles: z.array(ReturnDetailGetByIdSchema)
});
