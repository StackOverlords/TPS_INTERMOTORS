import { z } from "zod";
import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { BasePlaceorderFiltersSchema } from "../reportFilters.schema";

// Schema para un item individual del reporte top proveedores
export const OrderReportTopProveedoresItemSchema = z.object({
  proveedor: z.string(),
  apariciones: z.number(),
  ordenes: z.number(),
  monto_total: toNumberOrZeroStrict,
});

// Schema para la respuesta completa del endpoint
export const OrderReportTopProveedoresResponseSchema = z.object({
  data: z.array(OrderReportTopProveedoresItemSchema),
});

// Schema para los filtros del reporte top proveedores
export const OrderReportTopProveedoresFiltersSchema =
  BasePlaceorderFiltersSchema.extend({
    top_n: z.number().int().positive(),
  });
