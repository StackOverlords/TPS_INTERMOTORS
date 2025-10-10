import { ProductDetailSchema } from "@/modules/products/schemas/ProductDetail.schema";
import { moneySchema, requiredMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import z from "zod";

export const SupplierSchema = z.object({
    id: z.number(),
    proveedor: z.string(),
    direccion: z.string().nullable(),
    nit: z.string().nullable(),
    contacto: z.string().nullable(),
});

export const OrderDetailGetByIdSchema = z.object({
    id: z.number(),
    producto: ProductDetailSchema,
    cantidad: moneySchema,
    costo: moneySchema,
    inc_precio_venta: requiredMoneySchema,
    precio_venta: requiredMoneySchema,
    inc_precio_venta_alt: requiredMoneySchema,
    precio_venta_alt: requiredMoneySchema,
    orden: z.number().nullable(),
    moneda: z.string()
})

export const OrderByIdSchema = z.object({
    id: z.number(),
    fecha: z.coerce.date(),
    nro: z.string(),
    tipo_pedido: z.string(),
    forma_pedido: z.string(),
    comprobante: z.string().nullable(),
    comentarios: z.string().nullable(),
    situacion_actual: z.string(),
    proveedor: SupplierSchema,
    responsable: z.string().nullable(),
    cantidad_detalles: z.number(),
    detalles: z.array(OrderDetailGetByIdSchema)
});
