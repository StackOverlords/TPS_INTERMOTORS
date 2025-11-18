/**
 * Convierte un valor a número y lo formatea con decimales
 * Maneja strings, números y valores inválidos de forma segura
 *
 * @param value - El valor a formatear (puede ser string o number)
 * @param decimals - Número de decimales (default: 2)
 * @param fallback - Valor de fallback si el número no es válido (default: "0.00")
 * @returns String formateado con los decimales especificados
 *
 * @example
 * formatNumber("123.456", 2) // "123.46"
 * formatNumber(123.456, 2) // "123.46"
 * formatNumber("invalid", 2) // "0.00"
 * formatNumber(null, 2) // "0.00"
 */
export function formatNumber(
    value: string | number | null | undefined,
    decimals: number = 2,
    fallback: string = "0.00"
): string {
    // Si el valor es null o undefined, retornar fallback
    if (value == null) {
        return fallback;
    }

    // Convertir a número si es string
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    // Validar que sea un número finito
    if (!isFinite(numValue)) {
        return fallback;
    }

    // Formatear con los decimales especificados
    return numValue.toFixed(decimals);
}

/**
 * Formatea un número como precio con símbolo de moneda
 *
 * @param value - El valor a formatear
 * @param decimals - Número de decimales (default: 2)
 * @param currencySymbol - Símbolo de moneda (default: "$")
 * @returns String formateado como precio
 *
 * @example
 * formatPrice(123.456) // "$123.46"
 * formatPrice("123.456", 2, "Bs.") // "Bs.123.46"
 */
export function formatPrice(
    value: string | number | null | undefined,
    decimals: number = 2,
    currencySymbol: string = "$"
): string {
    const formattedNumber = formatNumber(value, decimals);
    return `${currencySymbol}${formattedNumber}`;
}
