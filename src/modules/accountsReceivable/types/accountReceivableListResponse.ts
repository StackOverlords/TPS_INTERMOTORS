import type { z } from "zod";
import type { AccountReceivableListResponseSchema } from "../schemas/accountReceivableResponse.schema";

export type AccountReceivableListResponse = z.infer<typeof AccountReceivableListResponseSchema>;
