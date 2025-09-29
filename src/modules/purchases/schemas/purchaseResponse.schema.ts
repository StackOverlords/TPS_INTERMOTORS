import { z } from "zod"
import { PurchaseGetSchema } from "./purchaseList.schema"

export const PurchaseListResponseSchema = z.object({
    data: z.array(PurchaseGetSchema),
    links: z.object({
        first: z.string(),
        last: z.string(),
        prev: z.string().nullable(),
        next: z.string().nullable(),
    }),
    meta: z.object({
        current_page: z.number(),
        from: z.number().nullable(), // ✅ Permite null cuando no hay datos
        last_page: z.number(),
        links: z.array(z.object({
            url: z.string().nullable(),
            label: z.string(),
            page: z.number().nullable().optional(), // ✅ Campo page es opcional
            active: z.boolean(),
        })),
        path: z.any().or(z.string()),
        per_page: z.any().or(z.number()),
        to: z.number().nullable(), // ✅ Permite null cuando no hay datos
        total: z.any().or(z.number()), // Acepta string o number
    }),
})
