import Decimal from "decimal.js";

// Configuración global: 5 decimales de precisión, redondeo HALF_UP
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
  minE: -9e15,
  maxE: 9e15,
});

/**
 * Valida que un valor sea un número válido
 * Retorna 0 si es null, undefined, NaN o Infinity
 */
export const validateNumber = (value: number | null | undefined): number => {
  if (value == null || isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return value;
};

/**
 * Multiplica precio por cantidad con precisión de 5 decimales
 */
export const multiplyPrecise = (a: number, b: number): number => {
  const validA = validateNumber(a);
  const validB = validateNumber(b);

  return new Decimal(validA)
    .times(validB)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Divide con precisión de 5 decimales
 */
export const dividePrecise = (dividend: number, divisor: number): number => {
  const validDividend = validateNumber(dividend);
  const validDivisor = validateNumber(divisor);

  if (validDivisor === 0) return 0;

  return new Decimal(validDividend)
    .dividedBy(validDivisor)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Suma con precisión
 */
export const addPrecise = (a: number, b: number): number => {
  const validA = validateNumber(a);
  const validB = validateNumber(b);

  return new Decimal(validA)
    .plus(validB)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Resta con precisión
 */
export const subtractPrecise = (a: number, b: number): number => {
  const validA = validateNumber(a);
  const validB = validateNumber(b);

  return new Decimal(validA)
    .minus(validB)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Calcula porcentaje: (valor / total) * 100
 * Con 5 decimales de precisión
 */
export const calculatePercent = (value: number, total: number): number => {
  const validValue = validateNumber(value);
  const validTotal = validateNumber(total);

  if (validTotal === 0) return 0;

  return new Decimal(validValue)
    .dividedBy(validTotal)
    .times(100)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Calcula monto desde porcentaje: (percent / 100) * total
 * Con 5 decimales de precisión
 */
export const calculateAmountFromPercent = (
  percent: number,
  total: number
): number => {
  const validPercent = validateNumber(percent);
  const validTotal = validateNumber(total);

  return new Decimal(validPercent)
    .dividedBy(100)
    .times(validTotal)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Redondea a 5 decimales con HALF_UP
 */
export const roundTo5Decimals = (value: number): number => {
  const validValue = validateNumber(value);

  return new Decimal(validValue)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Redondea a 2 decimales para mostrar en UI (montos finales)
 */
export const roundTo2Decimals = (value: number): number => {
  const validValue = validateNumber(value);

  return new Decimal(validValue)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Compara dos valores con precisión
 * Retorna: -1 si a < b, 0 si a === b, 1 si a > b
 */
export const comparePrecise = (a: number, b: number): number => {
  const validA = validateNumber(a);
  const validB = validateNumber(b);

  const decimalA = new Decimal(validA);
  const decimalB = new Decimal(validB);

  if (decimalA.lessThan(decimalB)) return -1;
  if (decimalA.greaterThan(decimalB)) return 1;
  return 0;
};

/**
 * Verifica si un valor es mayor que cero
 */
export const isGreaterThanZero = (value: number): boolean => {
  const validValue = validateNumber(value);
  return new Decimal(validValue).greaterThan(0);
};

/**
 * Verifica si un valor es mayor o igual a cero
 */
export const isGreaterOrEqualToZero = (value: number): boolean => {
  const validValue = validateNumber(value);
  return new Decimal(validValue).greaterThanOrEqualTo(0);
};

/**
 * Obtiene el valor mínimo entre dos números con precisión
 */
export const minPrecise = (a: number, b: number): number => {
  const validA = validateNumber(a);
  const validB = validateNumber(b);

  return Decimal.min(validA, validB)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Obtiene el valor máximo entre dos números con precisión
 */
export const maxPrecise = (a: number, b: number): number => {
  const validA = validateNumber(a);
  const validB = validateNumber(b);

  return Decimal.max(validA, validB)
    .toDecimalPlaces(5, Decimal.ROUND_HALF_UP)
    .toNumber();
};

/**
 * Suma múltiples valores con precisión (para reduce)
 */
export const sumPrecise = (values: number[]): number => {
  if (!values || values.length === 0) return 0;

  return values.reduce((acc, val) => {
    return addPrecise(acc, val);
  }, 0);
};
