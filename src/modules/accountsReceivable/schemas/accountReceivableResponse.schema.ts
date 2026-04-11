import { z } from "zod";
import { AccountReceivableSchema } from "./accountReceivable.schema";

export const AccountReceivableListResponseSchema = z.object({
    data: z.array(AccountReceivableSchema),
    links: z.object({
        first: z.string().nullable(),
        last: z.string().nullable(),
        prev: z.string().nullable(),
        next: z.string().nullable(),
    }).optional(),
    meta: z.object({
        current_page: z.number(),
        from: z.number().nullable(),
        last_page: z.number(),
        path: z.string(),
        per_page: z.number(),
        to: z.number().nullable(),
        total: z.number(),
        links: z.array(z.any()).optional(),
    }),
});
