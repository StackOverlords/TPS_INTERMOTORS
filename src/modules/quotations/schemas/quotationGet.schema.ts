import { saleGetAllSchema } from "@/modules/sales/schemas/salesGetAll.schema";
import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const QuotationGetSchema = saleGetAllSchema
    .omit({ nro_venta: true })
    .extend({
        nro_cotizacion: z.string(),
    })

export const QuotationGetAllResponseSchema = paginatedResponseSchema(QuotationGetSchema)