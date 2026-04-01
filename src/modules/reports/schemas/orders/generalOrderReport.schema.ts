import { z } from "zod";
import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { BasePlaceorderDownloadableFiltersSchema } from "../reportFilters.schema";

// Schema para un item individual del reporte general de pedidos
export const OrderReportGeneralItemSchema = z.object({
  fecha_pedido: z.string(),
  fecha_llegada: z.string().nullable(),
  nro: z.number(),
  codigo: z.string(),
  producto: z.string(),
  marca: z.string(),
  costo: toNumberOrZeroStrict,
  cantidad: toNumberOrZeroStrict,
  subtotal: toNumberOrZeroStrict,
  tipo_pedido: z.string(),
  tipo_compra: z.string(),
  proveedor: z.string(),
  estado_pedido: z.string(),
  ubicacion: z.string().nullable(),
  responsable: z.string().nullable(),
});

// Schema para la respuesta completa del endpoint
export const OrderReportGeneralResponseSchema = z.object({
  data: z.array(OrderReportGeneralItemSchema),
});

// Schema para los filtros del reporte general de pedidos
export const OrderReportGeneralFiltersSchema =
  BasePlaceorderDownloadableFiltersSchema;
