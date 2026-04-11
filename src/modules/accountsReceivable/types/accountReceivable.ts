import type { z } from "zod";
import type { AccountReceivableSchema } from "../schemas/accountReceivable.schema";

export type AccountReceivable = z.infer<typeof AccountReceivableSchema>;
