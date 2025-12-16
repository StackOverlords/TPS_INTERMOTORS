import { strictRequiredMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import { z } from "zod";

export const ReturnDetailUpdateSchema = z.object({
    almacen_out_dev_det_id: z.number().nullable(),
    almacen_out_det_id: z.number(),
    cantidad: z.number().positive(),
    precio: strictRequiredMoneySchema,
    comentario: z.string().nullable(),
    orden: z.number(),
    almacen_out_id: z.number().nullable(),
});

export const ReturnUpdateSchema = z.object({
    fecha: z.string(),
    nro_comprobante: z.string(),
    motivo_devolucion: z.string(),
    responsable: z.number(),
    comentarios: z.string().nullable(),
    detalles: z.array(ReturnDetailUpdateSchema).min(1),
});