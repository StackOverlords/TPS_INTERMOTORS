import { strictRequiredMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import { z } from "zod";

export const TransferDetailCreateSchema = z.object({
    producto_id: z.number(),
    cantidad_entrada_salida: z.number().positive(),
    costo_entrada: strictRequiredMoneySchema,
    precio_salida: strictRequiredMoneySchema,
    precio_entrada_venta: strictRequiredMoneySchema,
    precio_entrada_venta_alt: strictRequiredMoneySchema,
    incremento_p_entrada_venta: z.number(),
    incremento_p_entrada_venta_alt: z.number(),
    tc_transfer: z.number().nonnegative(),
    fecha_adquisicion: z.string().optional(),
});

export const TransferCreateSchema = z.object({
    fecha: z.string(),
    nro_comprobante: z.string(),
    comentarios: z.string().nullable(),
    sucursal_origen: z.number(),
    sucursal_destino: z.number(),
    responsable: z.number(),
    detalles: z.array(TransferDetailCreateSchema).min(1),
});
