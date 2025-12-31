import z from "zod";
import { ProductDetailSchema } from "@/modules/products/schemas/ProductDetail.schema";
import { SaleCustomerGetSchema } from "@/modules/sales/schemas/saleCustomer.schema";
import { SaleResponsibleSchema } from "@/modules/sales/schemas/saleResponsibles.schema";
import { moneySchema, requiredMoneySchema, toNumber } from "@/modules/shared/schemas/numberSchemas";
import { toBoolean } from "@/modules/shared/schemas/booleanSchemas";

export const QuotationItemSchema = z.object({
    id: z.number().int(),
    producto: ProductDetailSchema,
    descripcion: z.string().nullable(),
    cantidad: toNumber,
    precio: requiredMoneySchema,
    monenda: z.string(),
    descuento: moneySchema,
    porcentaje_descuento: moneySchema,
    marca: z.string().nullable(),
    orden: z.number().nullable(),
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
    es_pedido: toBoolean,
    plazo_pago: z.string().nullable(),
    vehiculo: z.string().nullable(),
    nmotor: z.string().nullable(),
    cliente: SaleCustomerGetSchema.nullable(),
    cliente_nit: z.string().nullable(),
    cliente_contacto: z.string().nullable(),
    cliente_telefono: z.string().nullable(),
    cliente_nombre: z.string().nullable(),
    responsable_cotizacion: SaleResponsibleSchema.nullable(),
    cantidad_detalles: toNumber,
    detalles: z.array(QuotationItemSchema),
})