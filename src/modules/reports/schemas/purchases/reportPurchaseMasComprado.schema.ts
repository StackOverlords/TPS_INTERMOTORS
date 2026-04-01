import { z } from "zod";
import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { BasePurchaseRankingDownloadableFiltersSchema } from "./purchaseReportFilters.schema";

// Schema para un item individual del reporte de más comprado
export const PurchaseReportMasCompradoItemSchema = z.object({
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
export const PurchaseReportMasCompradoResponseSchema = z.object({
  data: z.array(PurchaseReportMasCompradoItemSchema),
});

// Schema para los filtros del reporte de más comprado
export const PurchaseReportMasCompradoFiltersSchema =
  BasePurchaseRankingDownloadableFiltersSchema;
