import { baseFilterSchema } from "@/modules/shared/schemas/baseFilter.schema";
import { toUndefinedIfEmpty } from "@/utils/zodHelpers";
import z from "zod";

export const accountPayableFiltersSchema = baseFilterSchema.extend({
    // Filtro por número de venta
    nro_venta: z.preprocess(toUndefinedIfEmpty, z.string().optional()),

    // Filtro por cliente (ID)
    cliente: z.preprocess(toUndefinedIfEmpty, z.number().int().optional()),

    // Filtro por tipo de pago
    tipo_pago: z.preprocess(
        toUndefinedIfEmpty,
        z.enum(["EFECTIVO", "CHEQUE", "TRASNF"]).optional()
    ),

    // Filtros de rango de fecha de registro (no requiere condicion_fecha_especifica)
    fecha_inicio: z.preprocess(toUndefinedIfEmpty, z.string().optional()),
    fecha_fin: z.preprocess(toUndefinedIfEmpty, z.string().optional()),

    // Filtro por tipo de vencimiento (requiere condicion_vencimiento=true en el backend)
    tipo_vencimiento: z.preprocess(
        toUndefinedIfEmpty,
        z.enum([
            "SIN PLAZO",
            "VENCIDO",
            "POR VENCER EN 15 DIAS",
            "POR VENCER EN 30 DIAS",
            "POR VENCER EN 45 DIAS"
        ]).optional()
    ),
    condicion_vencimiento: z.preprocess(toUndefinedIfEmpty, z.boolean().optional()),

    // Filtro por fecha específica (requiere condicion_fecha_especifica=true)
    condicion_fecha_especifica: z.preprocess(toUndefinedIfEmpty, z.boolean().optional()),
    fecha_vencimiento_regla: z.preprocess(
        toUndefinedIfEmpty,
        z.enum(["=", ">=", "<="]).optional()
    ),
    fecha_vencimiento: z.preprocess(toUndefinedIfEmpty, z.string().optional()),
});
