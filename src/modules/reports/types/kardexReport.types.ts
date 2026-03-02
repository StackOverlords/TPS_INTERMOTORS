import type z from "zod";
import type {
  KardexItemSchema,
  KardexReportFiltersSchema,
  KardexReportResponseSchema,
} from "../schemas/products/kardexReportProduct.schema";

export type KardexReportItem = z.infer<typeof KardexItemSchema>;
export type KardexReportResponse = z.infer<typeof KardexReportResponseSchema>;
export type KardexReportFilters = z.infer<typeof KardexReportFiltersSchema>;
