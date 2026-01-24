import { z } from "zod";

export const StockMinimoItemSchema = z.object({
  codigo: z.string(),
  producto: z.string(),
  stock_actual: z.string(),
  stock_minimo: z.string(),
  diferencia: z.number(),
});

export const StockMinimoReportResponseSchema = z.object({
  data: z.array(StockMinimoItemSchema),
});

export const StockMinimoFiltersSchema = z.object({
  sucursal: z.number(),
  ver_solo_con_saldo_menorigual_al_minimo: z.boolean().optional(),
  ver_solo_con_saldo_cercano_al_minimo_segun_parametro: z.boolean().optional(),
  parametro: z.number().optional(),
  downloadable: z.boolean().optional(),
});
