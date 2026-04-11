import { z } from "zod";
import { CxPListItemSchema } from "./cxpReport.schema";

/**
 * Schema para la respuesta paginada de la lista de CxP
 *
 * GET /api/v1/account-payable
 */
export const CxPListResponseSchema = z.object({
    data: z.array(CxPListItemSchema),
    links: z
        .object({
            first: z.string().nullable(),
            last: z.string().nullable(),
            prev: z.string().nullable(),
            next: z.string().nullable(),
        })
        .optional(),
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

export type CxPListResponse = z.infer<typeof CxPListResponseSchema>;
