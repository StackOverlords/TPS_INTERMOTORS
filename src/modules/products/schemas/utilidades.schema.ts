import { z } from "zod";

// Schema para un item individual del reporte
export const utilidadesItemSchema = z.object({
  codigo: z.string(),
  producto: z.string(),
  ventas: z.union([z.string(), z.number()]).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ),
  importe_costo: z.union([z.string(), z.number()]).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ),
  importe_venta: z.union([z.string(), z.number()]).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ),
  utilidad: z.union([z.string(), z.number()]).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ),
});

// Schema para la respuesta completa del reporte
export const utilidadesReportResponseSchema = z.object({
  data: z.array(utilidadesItemSchema),
});

export type UtilidadesItemSchema = z.infer<typeof utilidadesItemSchema>;
export type UtilidadesReportResponseSchema = z.infer<
  typeof utilidadesReportResponseSchema
>;
