import { z } from "zod";

// Helper para transformar valores numéricos que pueden ser null
const nullableNumberTransform = z
  .union([z.string(), z.number(), z.null()])
  .transform((val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  });

// Schema para un item individual del reporte
export const inventarioItemSchema = z.object({
  codigo: z.string(),
  producto: z.string(),
  compras: nullableNumberTransform,
  ventas: nullableNumberTransform,
  stock: nullableNumberTransform,
  costo_promedio: nullableNumberTransform,
  valor: nullableNumberTransform,
});

// Schema para la meta de paginación del reporte de inventario
const inventarioMetaSchema = z.object({
  per_page: z.number(),
  total_pages: z.number(),
  current_page: z.number(),
  total_records: z.number(),
});

// Schema para la respuesta completa del reporte
export const inventarioReportResponseSchema = z.object({
  data: z.array(inventarioItemSchema),
  meta: inventarioMetaSchema,
});

export type InventarioItemSchema = z.infer<typeof inventarioItemSchema>;
export type InventarioReportResponseSchema = z.infer<
  typeof inventarioReportResponseSchema
>;
