import { z } from "zod";

/**
 * Schema reutilizable para valores monetarios o numéricos con precisión decimal.
 * Acepta strings numéricos, convierte a número, y permite null.
 */
export const moneySchema = z.preprocess(
    (v) => {
        if (v === "" || v === undefined || v === null) return null;
        const parsed = parseFloat(v as string);
        return isNaN(parsed) ? v : parsed;
    },
    z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))).nullable()
);

/**
 * Variante obligatoria (no permite null)
 */
export const requiredMoneySchema = z.preprocess(
    (v) => {
        const parsed = parseFloat(v as string);
        return isNaN(parsed) ? v : parsed;
    },
    z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5)))
);

/**
 * Variante estricta: solo acepta número (útil si ya está parseado).
 */
export const strictMoneySchema = z
    .number()
    .nonnegative()
    .transform((val) => parseFloat(val.toFixed(5)))
    .nullable();

/**
 * Variante estricta y obligatoria (no permite null)
 */
export const strictRequiredMoneySchema = z
    .number()
    .nonnegative()
    .transform((val) => parseFloat(val.toFixed(5)));

/**
 * convierte un valor a número o null (si es cadena vacía, undefined o null)
 */
export const toNumberOrNull = z.preprocess((v) => {
    if (v === "" || v === undefined || v === null) return null;
    const parsed = parseFloat(v as string);
    return isNaN(parsed) ? v : parsed;
}, z.number().nullable());

/**
 * convierte un valor a número (no permite null)
 */
export const toNumber = z.preprocess((v) => {
    const parsed = parseFloat(v as string);
    return isNaN(parsed) ? v : parsed;
}, z.number());