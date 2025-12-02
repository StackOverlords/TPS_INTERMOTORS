import { ProductDetailSchema } from "@/modules/products/schemas/ProductDetail.schema";
import { moneySchema, requiredMoneySchema, toNumberOrNull } from "@/modules/shared/schemas/numberSchemas";
import z from "zod";

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

export const OrderDetailGetByIdSchema = z.object({
    id: z.number(),
    producto: ProductDetailSchema,
    cantidad: requiredMoneySchema,
    costo: requiredMoneySchema,
    inc_precio_venta: moneySchema,
    precio_venta: moneySchema,
    inc_precio_venta_alt: moneySchema,
    precio_venta_alt: moneySchema,
    orden: toNumberOrNull,
    moneda: z.string()
})

export const OrderByIdSchema = z.object({
    id: z.number(),
    // fecha: z.coerce.date(),
    fecha: z.string(),
    nro: z.string(),
    tipo_pedido: z.string(),
    forma_pedido: z.string(),
    comprobante: z.string().nullable(),
    comentarios: z.string().nullable(),
    situacion_actual: z.string(),
    proveedor: SupplierSchema,
    responsable: ResponsableSchema.nullable(),
    cantidad_detalles: z.number(),
    detalles: z.array(OrderDetailGetByIdSchema),
    fecha_llegada: z.string().nullable(),
    fecha_transito: z.string().nullable(),
});
