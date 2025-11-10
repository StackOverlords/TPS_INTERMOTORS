import z from "zod";
import { ProductDetailSchema } from "@/modules/products/schemas/ProductDetail.schema";
import { SaleCustomerGetSchema } from "@/modules/sales/schemas/saleCustomer.schema";
import { SaleResponsibleSchema } from "@/modules/sales/schemas/saleResponsibles.schema";
import { moneySchema } from "@/modules/shared/schemas/numberSchemas";

export const QuotationItemSchema = z.object({
    id: z.number().int(),
    producto: ProductDetailSchema,
    descripcion: z.string().nullable(),
    cantidad: z.preprocess(
        (val) => (typeof val === "string" ? parseFloat(val) : val),
        z.number()
    ),
    precio: z.preprocess(
        (val) => (typeof val === "string" ? parseFloat(val) : val),
        z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5)))
    ),
    monenda: z.string(),
    descuento: z.preprocess(
        (val) => (val == null ? null : parseFloat(val as string)),
        z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))).nullable()
    ),
    porcentaje_descuento: z.preprocess(
        (val) => (val == null ? null : parseFloat(val as string)),
        z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))).nullable()
    ),
    marca: z.string().nullable()
})

export const QuotationGetByIdSchema = z.object({
    id: z.number().int(),
    fecha: z.string(),
    nro: z.string(),
    tipo_cotizacion: z.string().nonempty(),
    forma_cotizacion: z.string().nonempty(),
    comprobante: z.string().nullable(),
    comprobante2: z.string().nullable(),
    comentarios: z.string().nullable(),
    anticipo: moneySchema,
    es_pedido: z.boolean(),
    plazo_pago: z.string().nullable(),
    vehiculo: z.string().nullable(),
    nmotor: z.string().nullable(),
    cliente: SaleCustomerGetSchema.nullable(),
    cliente_nit: z.string().nullable(),
    cliente_contacto: z.string().nullable(),
    cliente_telefono: z.string().nullable(),
    responsable_cotizacion: SaleResponsibleSchema.nullable(),
    cantidad_detalles: z.number().int(),
    detalles: z.array(QuotationItemSchema),
})