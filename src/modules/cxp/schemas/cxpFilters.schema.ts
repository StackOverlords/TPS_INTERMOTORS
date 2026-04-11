import { z } from "zod";

/**
 * Schema para los filtros de la lista paginada de CxP
 *
 * GET /api/v1/account-payable?sucursal=X&proveedor=X&fecha_inicio=X&fecha_fin=X
 */
export const CxPFiltersSchema = z.object({
    sucursal: z.number().int().optional(),
    proveedor: z.number().int().nullable().optional(),
    fecha_inicio: z.string().optional(),
    fecha_fin: z.string().optional(),
    pagina: z.number().int().positive().optional(),
    pagina_registros: z.number().int().positive().optional(),
});

export type CxPFilters = z.infer<typeof CxPFiltersSchema>;
