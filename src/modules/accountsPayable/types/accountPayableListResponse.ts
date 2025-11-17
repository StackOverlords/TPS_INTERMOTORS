import type { z } from "zod";
import type { AccountPayableListResponseSchema } from "../schemas/accountPayableResponse.schema";

export type AccountPayableListResponse = z.infer<typeof AccountPayableListResponseSchema>;
