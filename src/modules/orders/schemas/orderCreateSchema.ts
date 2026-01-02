import { strictRequiredMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import { z } from "zod";

export const OrderDetailCreateSchema = z.object({
    id_producto: z.number(),
    cantidad: z.number().positive(),
    costo: strictRequiredMoneySchema,
    inc_p_venta: strictRequiredMoneySchema,
    precio_venta: strictRequiredMoneySchema,
    inc_p_venta_alt: strictRequiredMoneySchema,
    precio_venta_alt: strictRequiredMoneySchema,
    orden: z.number().int(),
    tc_compra: z.number().positive().nullable(),  // Tipo de cambio (puede ser null cuando moneda es BOB)
});

export const OrderCreateSchema = z.object({
    fecha: z.string(),
    nro_comprobante: z.string(),
    id_proveedor: z.number(),
    tipo_pedido: z.string(),
    forma_pedido: z.string(),
    estado_actual: z.string(),
    fecha_llegada: z.string().optional(),
    fecha_inicio_transito: z.string().optional(),
    comentario: z.string().nullable(),
    sucursal: z.number(),
    id_responsable: z.number(),
    detalles: z.array(OrderDetailCreateSchema).min(1),
});