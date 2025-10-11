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

const ResponsableSchema = z.object({
    apellido_materno: z.string().nullable(),
    apellido_paterno: z.string().nullable(),
    celular: z.string().nullable(),
    dni: z.number().nullable(),
    id: z.number(),
    nombre: z.string(),
});

export const OrderGetSchema = z.object({
    id: z.number(),
    nro_pedido: z.string(),
    fecha: z.string(),
    comprobante: z.string().nullable(),
    contexto: z.string(),
    proveedor: SupplierSchema.nullable(),
    responsable: ResponsableSchema.nullable(),
    numero_items: z.number(),
    total: strictMoneySchema,
    comentarios: z.string().nullable(),
    fecha_llegada: z.string().nullable(),
    fecha_transito: z.string().nullable(),
    situacion_actual: z.string(),
});

export const OrdersGetAllSchema = paginatedResponseSchema(OrderGetSchema);