import { z } from "zod";

/**
 * Filtros base compartidos entre todos los reportes de compras.
 * Extender con `.extend({})` para agregar campos específicos.
 */
export const BasePurchaseFiltersSchema = z.object({
  fecha_inicio: z.string(),
  fecha_fin: z.string().optional(),
  sucursal: z.number().nullable().optional(),
});

/**
 * Filtros base + downloadable (para reportes con soporte Excel)
 */
export const BasePurchaseDownloadableFiltersSchema =
  BasePurchaseFiltersSchema.extend({
    downloadable: z.boolean().optional(),
  });

/**
 * Filtros base + ranking + downloadable (para reportes de ranking)
 */
export const BasePurchaseRankingDownloadableFiltersSchema =
  BasePurchaseDownloadableFiltersSchema.extend({
    ranking: z.number(),
  });
