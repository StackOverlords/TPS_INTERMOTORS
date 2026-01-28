import { z } from "zod";

// Schema para un item de cuenta por cobrar
export const accountsReceivableItemSchema = z.object({
  nro_venta: z.union([z.string(), z.number()]).transform((val) => String(val)),
  fecha: z.string(),
  cliente: z.string(),
  total: z.union([z.string(), z.number()]),
  pagos: z.union([z.string(), z.number()]),
  saldo: z.union([z.string(), z.number()]),
});

// Schema para la respuesta del reporte
export const accountsReceivableReportResponseSchema = z.object({
  data: z.array(accountsReceivableItemSchema),
});
