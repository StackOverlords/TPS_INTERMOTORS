import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { z } from "zod";

// Schema para un item individual del reporte
export const KardexItemSchema = z.object({
  fecha: z.string(),
  tipo_transaccion: z.string(),
  num_transaccion: z.string(),
  proveedor_cliente: z.string(),
  cantidad: toNumberOrZeroStrict,
  entrada_costo: toNumberOrZeroStrict,
  entrada_total: toNumberOrZeroStrict,
  salida_precio: toNumberOrZeroStrict,
  salida_total: toNumberOrZeroStrict,
  saldo: toNumberOrZeroStrict,
});

// Schema para la respuesta completa del endpoint
export const KardexReportResponseSchema = z.object({
  data: z.array(KardexItemSchema),
});

// Schema para los filtros del reporte general
export const KardexReportFiltersSchema = z.object({
  producto: z.number(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  sucursal: z.number().nullable().optional(),
  downloadable: z.boolean().optional(),
});
