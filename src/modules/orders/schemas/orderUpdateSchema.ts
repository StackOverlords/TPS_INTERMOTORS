import { strictRequiredMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import { z } from "zod";

export const OrderDetailUpdateSchema = z.object({
    id_detalle_pedido: z.number().nullable(),
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

export const OrderUpdateSchema = z.object({
    fecha: z.string(),
    nro_comprobante: z.string(),
    id_proveedor: z.number(),
    tipo_pedido: z.string(),
    forma_pedido: z.string(),
    estado_actual: z.string(),
    fecha_llegada: z.string().optional(),
    fecha_inicio_transito: z.string().optional(),
    comentario: z.string().nullable(),
    id_responsable: z.number(),
    detalles: z.array(OrderDetailUpdateSchema).min(1),
});