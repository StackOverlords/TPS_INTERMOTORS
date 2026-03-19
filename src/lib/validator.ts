import type z from "zod";
import { Logger } from "./logger";
import { withFallbacks } from "./schemaTransformer";

export class Validator {
    static validate<T>(
        schema: z.ZodSchema<T>,
        data: unknown,
        context?: string
    ): T {
        const robustSchema = withFallbacks(schema as z.ZodTypeAny) as z.ZodSchema<T>;
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