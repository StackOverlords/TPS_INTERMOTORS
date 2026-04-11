import type z from "zod";
import type { accountReceivableFiltersSchema } from "../schemas/accountReceivableFilter.schema";

export type AccountReceivableFilters = z.infer<typeof accountReceivableFiltersSchema>;
