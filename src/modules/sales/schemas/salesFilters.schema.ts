import { baseFilterSchema } from "@/modules/shared/schemas/baseFilter.schema";
import { toDateOrUndefined, toUndefinedIfEmpty } from "@/utils/zodHelpers";
import z from "zod";

export const salesFiltersSchema = baseFilterSchema.extend({
    keywords: z.preprocess(toUndefinedIfEmpty, z.string().optional()),
    codigo_interno: z.preprocess(toUndefinedIfEmpty, z.number().int().optional()),
    cliente: z.preprocess(toUndefinedIfEmpty, z.number().int().optional()),
    fecha_inicio: z.preprocess(toDateOrUndefined, z.date().optional()),
    fecha_fin: z.preprocess(toDateOrUndefined, z.date().optional()),
    codigo_oem_producto: z.preprocess(toUndefinedIfEmpty, z.string().optional()),
    sin_convertir: z.boolean().optional(),
})