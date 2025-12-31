import { SaleCustomerGetSchema } from "@/modules/sales/schemas/saleCustomer.schema";
import { saleGetAllSchema } from "@/modules/sales/schemas/salesGetAll.schema";
import { toNumberOrZero, toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const QuotationGetSchema = saleGetAllSchema
    .omit({ nro_venta: true, cliente: true })
    .extend({
        nro_cotizacion: z.string(),
        vehiculo: z.string().nullable(),
        nmotor: z.string().nullable(),
        anticipo: toNumberOrZeroStrict,
        pedido: z.boolean(),
        cliente: SaleCustomerGetSchema.extend({
            celular: z.string().nullable(),
            id: z.number().int(),
            nro_cliente: toNumberOrZero,
            telefono: z.string().nullable(),
        }).nullable(),
    })

export const QuotationGetAllResponseSchema = paginatedResponseSchema(QuotationGetSchema)