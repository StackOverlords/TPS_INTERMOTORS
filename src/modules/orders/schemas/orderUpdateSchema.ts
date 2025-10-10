import { strictMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import { z } from "zod";

export const OrderDetailUpdateSchema = z.object({
    id_detalle_pedido: z.number().nullable(),
    id_producto: z.number(),
    cantidad: z.number().positive(),
    costo: strictMoneySchema,
    inc_p_venta: strictMoneySchema,
    precio_venta: strictMoneySchema,
    inc_p_venta_alt: strictMoneySchema,
    precio_venta_alt: strictMoneySchema,
    orden: z.number().int(),
});

export const OrderUpdateSchema = z.object({
    fecha: z.string(),
    nro_comprobante: z.string(),
    id_proveedor: z.number(),
    tipo_pedido: z.string(),
    forma_pedido: z.string(),
    estado_actual: z.string(),
    fecha_llegada: z.string(),
    fecha_inicio_transito: z.string(),
    comentario: z.string().nullable(),
    id_responsable: z.number(),
    detalles: z.array(OrderDetailUpdateSchema).min(1),
});

export type OrderUpdateInput = z.infer<typeof OrderUpdateSchema>;
