import z from "zod";

/**
 * Convierte cualquier valor a boolean.
 * - true → true
 * - false | null | undefined → false
 */
export const toBoolean = z.preprocess(
    (v) => v === true,
    z.boolean()
);

/**
* Convierte a boolean o null
*/
export const toBooleanOrNull = z.preprocess(
    (v) => (v === true ? true : null),
    z.boolean().nullable()
);
