import { z } from "zod";
import { AccountPayableSchema } from "./accountPayable.schema";

export const AccountPayableListResponseSchema = z.object({
    data: z.array(AccountPayableSchema),
    meta: z.object({
        total: z.number(),
    }),
});
