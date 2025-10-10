import { strictMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import { z } from "zod";

export const SupplierSchema = z.object({
    id: z.number(),
    proveedor: z.string(),
    direccion: z.string().nullable(),
    nit: z.string().nullable(),
    contacto: z.string().nullable(),
});

export const OrderGetSchema = z.object({
    id: z.number(),
    nro_pedido: z.string(),
    fecha: z.string(),
    comprobante: z.string(),
    contexto: z.string(),
    proveedor: SupplierSchema,
    responsable: z.string().nullable(),
    numero_items: z.number(),
    total: strictMoneySchema,
    comentarios: z.string().nullable(),
    fecha_llegada: z.string(),
    fecha_transito: z.string(),
    situacion_actual: z.string(),
});

export const OrdersGetAllSchema = paginatedResponseSchema(OrderGetSchema);