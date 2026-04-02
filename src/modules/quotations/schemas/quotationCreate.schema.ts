import { z } from "zod";

export const QuotationDetailSchema = z.object({
    id_producto: z.number(),
    descripcion: z.string().nullable(),
    cantidad: z.number().positive(),
    precio: z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))),
    descuento: z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))),
    porcentaje_descuento: z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))),
    nueva_marca: z.string().nullable(),
    orden: z.number().nullable()
});

export const QuotationCreateSchema = z.object({
    fecha: z.string().nonempty(),
    nro_comprobante: z.string().nullable(),
    nro_comprobante2: z.string().nullable(),
    id_cliente: z.number(),
    cliente_nombre: z.string().nullable(),
    cliente_contacto: z.string().nullable(),
    cliente_nit: z.string().nullable(),
    cliente_telefono: z.string().nullable(),
    tipo_cotizacion: z.string().nonempty(),
    forma_cotizacion: z.string().nonempty(),
    comentarios: z.string().nullable(),
    plazo_pago: z.string().nullable(),
    vehiculo: z.string().nullable(),
    nro_motor: z.string().nullable(),
    anticipo: z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))).nullable(),
    forma_pago_anticipo: z.enum(['EFECTIVO', 'CHEQUE', 'TRASNF', 'QR', 'QR-EFECT']).nullable(),
    pedido: z.boolean(),
    sucursal: z.number(),
    id_responsable: z.number(),
    detalles: z.array(QuotationDetailSchema)
});
export const QuotationDetailListSchema = z.array(QuotationDetailSchema).nonempty()