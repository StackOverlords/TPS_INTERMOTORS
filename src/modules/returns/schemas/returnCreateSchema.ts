import { strictRequiredMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import { z } from "zod";

export const ReturnDetailCreateSchema = z.object({
    almacen_out_det_id: z.number(),
    cantidad: z.number().positive(),
    precio: strictRequiredMoneySchema,
    comentario: z.string().nonempty(),
    orden: z.number(),
    almacen_out_id: z.number(),
});

export const ReturnCreateSchema = z.object({
    fecha: z.string(),
    nro_comprobante: z.string(),
    motivo_devolucion: z.string(),
    responsable: z.number(),
    comentarios: z.string().nullable(),
    sucursal: z.number(),
    detalles: z.array(ReturnDetailCreateSchema).min(1),
});