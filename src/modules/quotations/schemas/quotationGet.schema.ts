import { saleGetAllSchema } from "@/modules/sales/schemas/salesGetAll.schema";
import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const QuotationGetSchema = saleGetAllSchema
    .omit({ nro_venta: true })
    .extend({
        nro_cotizacion: z.string(),
        vehiculo: z.string().nullable(),
        nmotor: z.string().nullable(),
        anticipo: toNumberOrZeroStrict,
        pedido: z.boolean(),
    })

export const QuotationGetAllResponseSchema = paginatedResponseSchema(QuotationGetSchema)