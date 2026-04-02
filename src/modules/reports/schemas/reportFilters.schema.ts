import { z } from "zod";

/**
 * Filtros base compartidos entre todos los reportes de pedidos.
 * Extender con `.extend({})` para agregar campos específicos.
 */
export const BasePlaceorderFiltersSchema = z.object({
  fecha_inicio: z.string(),
  fecha_fin: z.string().optional(),
  sucursal: z.number().nullable().optional(),
});

/**
 * Filtros base + downloadable (para reportes con soporte Excel)
 */
export const BasePlaceorderDownloadableFiltersSchema =
  BasePlaceorderFiltersSchema.extend({
    downloadable: z.boolean().optional(),
  });
