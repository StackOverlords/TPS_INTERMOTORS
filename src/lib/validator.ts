import type z from "zod";
import { Logger } from "./logger";
import { withFallbacks } from "./schemaTransformer";

/**
 * `withFallbacks` recorre y reconstruye el schema completo. Los schemas son
 * constantes de módulo, así que se transforma una sola vez por schema en lugar
 * de en cada respuesta HTTP.
 */
const robustSchemas = new WeakMap<z.ZodTypeAny, z.ZodTypeAny>();

function getRobustSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
    let robust = robustSchemas.get(schema);
    if (!robust) {
        robust = withFallbacks(schema);
        robustSchemas.set(schema, robust);
    }
    return robust;
}

export class Validator {
    static validate<T>(
        schema: z.ZodSchema<T>,
        data: unknown,
        context?: string
    ): T {
        const robustSchema = getRobustSchema(schema as z.ZodTypeAny) as z.ZodSchema<T>;
        const result = robustSchema.safeParse(data);

        if (!result.success) {
            const errorMessage = `Validation failed${context ? ` for ${context}` : ''}`;

            Logger.error(errorMessage, {
                zodError: result.error.format(),
                receivedData: data,
            }, 'VALIDATOR');

            // Backend inconsistente — loguear y retornar datos sin parsear
            // en lugar de reventar la UI con una pantalla de error
            return data as T;
        }

        Logger.debug(
            `Validation successful${context ? ` for ${context}` : ''}`,
            { dataType: typeof data },
            'VALIDATOR'
        );

        return result.data;
    }
}