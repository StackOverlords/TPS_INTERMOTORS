import { z } from "zod";

/**
 * Recorre un schema Zod recursivamente y agrega `.catch(fallback)` en cada
 * tipo primitivo. Esto previene que null/undefined del backend revienten
 * componentes que esperan string, number o boolean.
 *
 * Casos cubiertos:
 *   null  donde esperaba string  → "N/A"
 *   null  donde esperaba number  → 0
 *   null  donde esperaba boolean → false
 *
 * Los campos ya declarados como `.nullable()` o `.optional()` no se ven
 * afectados — solo actúa cuando el parse FALLA.
 */
export function withFallbacks<T extends z.ZodTypeAny>(schema: T): T {
    if (schema instanceof z.ZodString) {
        return schema.catch("N/A") as unknown as T;
    }

    if (schema instanceof z.ZodNumber) {
        return schema.catch(0) as unknown as T;
    }

    if (schema instanceof z.ZodBoolean) {
        return schema.catch(false) as unknown as T;
    }

    if (schema instanceof z.ZodObject) {
        const newShape: Record<string, z.ZodTypeAny> = {};
        for (const [key, val] of Object.entries(
            schema.shape as Record<string, z.ZodTypeAny>
        )) {
            newShape[key] = withFallbacks(val);
        }
        return z.object(newShape) as unknown as T;
    }

    if (schema instanceof z.ZodArray) {
        return z.array(withFallbacks(schema.element)) as unknown as T;
    }

    if (schema instanceof z.ZodNullable) {
        return z.nullable(withFallbacks(schema._def.innerType)) as unknown as T;
    }

    if (schema instanceof z.ZodOptional) {
        return z.optional(withFallbacks(schema._def.innerType)) as unknown as T;
    }

    // ZodEffects (.transform, .refine), ZodUnion, ZodEnum, ZodLiteral, etc.
    // — pasar sin modificar
    return schema;
}
