import { z } from "zod";
import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { BasePurchaseDownloadableFiltersSchema } from "./purchaseReportFilters.schema";

// Schema para un item individual del reporte general de compras
export const PurchaseReportGeneralItemSchema = z.object({
  ubicacion: z.string(),
  codigo: z.string(),
  producto: z.string(),
  grupo: z.string(),
  linea: z.string(),
  cantidad: toNumberOrZeroStrict,
  costo_medio: toNumberOrZeroStrict,
  subtotal: toNumberOrZeroStrict,
});

// Schema para la respuesta completa del endpoint
export const PurchaseReportGeneralResponseSchema = z.object({
  data: z.array(PurchaseReportGeneralItemSchema),
});

// Schema para los filtros del reporte general de compras
export const PurchaseReportGeneralFiltersSchema =
  BasePurchaseDownloadableFiltersSchema;
