import { z } from "zod";
import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { BasePlaceorderFiltersSchema } from "../reportFilters.schema";

// Schema para un item individual del reporte tiempo medio
export const OrderReportTiempoMedioItemSchema = z.object({
  proveedor: z.string(),
  ordenes_completadas: z.number(),
  dias_promedio: toNumberOrZeroStrict,
  dias_minimo: z.number(),
  dias_maximo: z.number(),
});

// Schema para la respuesta completa del endpoint
export const OrderReportTiempoMedioResponseSchema = z.object({
  data: z.array(OrderReportTiempoMedioItemSchema),
});

// Schema para los filtros del reporte tiempo medio
// No requiere campos adicionales; reutiliza la base directamente
export const OrderReportTiempoMedioFiltersSchema = BasePlaceorderFiltersSchema;
