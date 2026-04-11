import { toUndefinedIfEmpty } from "@/utils/zodHelpers";
import { z } from "zod";

/**
 * Schema para filtros de pagos
 */
export const PaymentFiltersSchema = z.object({
    id_venta: z.number().int(),
    nro_pago: z.preprocess(toUndefinedIfEmpty, z.number().int().optional()),
    fecha_inicio: z.preprocess(toUndefinedIfEmpty, z.string().optional()),
    fecha_fin: z.preprocess(toUndefinedIfEmpty, z.string().optional()),
});

export type PaymentFilters = z.infer<typeof PaymentFiltersSchema>;
