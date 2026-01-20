import z from "zod";
import { SaleDetailSchema, SaleSchema } from "./sales.schema";

export const SaleProductDetailSchema = z.object({
    id: z.number(),
    descripcion: z.string(),
    codigo_oem: z.string().nullable(),
    codigo_upc: z.string().nullable(),
    precio_venta: z.coerce.number(),
    categoria: z.string().nullable(),
    marca: z.string(),
    stock_actual:z.number().nonnegative()
})

export const SaleUpdateDetailSchema = SaleDetailSchema
    .extend({
        id_detalle_venta: z.number().nullable(),
    })

export const SaleUpdateSchema = SaleSchema
    .omit({
        detalles: true,
    })
    .extend({
        detalles: z.array(SaleUpdateDetailSchema)
    })

// Para la UI (venta completa)
export const SaleUpdateDetailUISchema = SaleUpdateDetailSchema.extend({
    producto: SaleProductDetailSchema,
    cantidad_dev: z.number().nonnegative(),
});

export const SaleUpdateFormSchema = SaleUpdateSchema
    .omit({
        detalles: true
    })
    .extend({
        detalles: z.array(SaleUpdateDetailUISchema)
    })