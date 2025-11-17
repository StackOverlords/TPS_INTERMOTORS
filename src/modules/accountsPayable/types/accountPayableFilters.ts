import type z from "zod";
import type { accountPayableFiltersSchema } from "../schemas/accountPayableFilter.schema";

export type AccountPayableFilters = z.infer<typeof accountPayableFiltersSchema>;
