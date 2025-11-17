import type { z } from "zod";
import type { AccountPayableSchema } from "../schemas/accountPayable.schema";

export type AccountPayable = z.infer<typeof AccountPayableSchema>;
