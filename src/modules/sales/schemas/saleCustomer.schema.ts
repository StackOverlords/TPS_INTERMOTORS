import { toNumberOrZero } from "@/modules/shared/schemas/numberSchemas"
import { z } from "zod"

export const SaleCustomerSchema = z.object({
    id: z.number().int(),
    nombre: z.string(),
    nit: z.number().nullable(),
})

export const SaleCustomerGetSchema = SaleCustomerSchema.omit({ nombre: true }).extend({
    cliente: z.string(),
    direccion: z.string().nullable(),
    contacto: z.string().nullable(),
    celular: z.string().nullable(),
    id: z.number().int(),
    nro_cliente: toNumberOrZero,
})

export const SaleCustomerListResponseSchema = z.object({
    data: z.array(SaleCustomerSchema),
    links: z.object({
        first: z.string(),
        last: z.string(),
        prev: z.string().nullable(),
        next: z.string().nullable(),
    }),
    meta: z.object({
        current_page: z.number(),
        from: z.number().nullable(),
        last_page: z.number(),
        links: z.array(
            z.object({
                url: z.string().nullable(),
                label: z.string(),
                active: z.boolean(),
            })
        ),
        path: z.string(),
        per_page: z.number(),
        to: z.number().nullable(),
        total: z.number(),
    }),
})
