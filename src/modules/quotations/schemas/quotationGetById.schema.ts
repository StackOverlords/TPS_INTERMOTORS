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
    anticipo_pagado: z.boolean().optional().default(false),
    forma_pago_anticipo: z.enum(['EFECTIVO', 'CHEQUE', 'TRASNF', 'QR', 'QR-EFECT']).nullable().optional().default(null),
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
    convertida: z.boolean().optional().default(false),
    caja_sesion_id: z.number().int().nullable().optional(),
    caja_sesion: z.object({
        id: z.number().int(),
        estado: z.string(),
    }).nullable().optional(),
    cantidad_detalles: toNumber,
    detalles: z.array(QuotationItemSchema),
    movimientos_caja: z.array(z.object({
        id: z.number().int(),
        tipo_movimiento: z.enum(['INGRESO', 'EGRESO']),
        concepto: z.string(),
        concepto_label: z.string(),
        monto: z.coerce.number(),
        forma_pago: z.string(),
        forma_pago_label: z.string(),
        fecha_reg: z.string(),
    })).optional().default([]),
})