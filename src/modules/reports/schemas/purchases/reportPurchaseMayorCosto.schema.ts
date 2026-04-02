import { z } from "zod";
import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { BasePurchaseRankingDownloadableFiltersSchema } from "./purchaseReportFilters.schema";

// Schema para un item individual del reporte de mayor costo
export const PurchaseReportMayorCostoItemSchema = z.object({
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
export const PurchaseReportMayorCostoResponseSchema = z.object({
  data: z.array(PurchaseReportMayorCostoItemSchema),
});

// Schema para los filtros del reporte de mayor costo
export const PurchaseReportMayorCostoFiltersSchema =
  BasePurchaseRankingDownloadableFiltersSchema;
