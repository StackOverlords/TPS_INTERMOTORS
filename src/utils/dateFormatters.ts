import { format, parse, isToday } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Obtiene la zona horaria del navegador/sistema
 *
 * @returns Zona horaria en formato IANA (ej: "America/La_Paz")
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

/**
 * Formatea una fecha con hora actual y milisegundos en la zona horaria local
 *
 * @param date - Objeto Date o fecha en formato "yyyy-MM-dd"
 * @param timezone - Zona horaria (por defecto: zona horaria del sistema)
 * @returns Fecha formateada como "yyyy-MM-dd HH:mm:ss.SSS"
 *
 * @example
 * formatDateWithCurrentTime(new Date()) // "2025-12-28 11:19:54.511"
 * formatDateWithCurrentTime("2025-12-28") // "2025-12-28 11:19:54.511"
 */
export const formatDateWithCurrentTime = (
  date: Date | string,
  timezone?: string
): string => {
  const tz = timezone || getUserTimezone();

  // Si es string, parsearlo; si es Date, usarlo directamente
  const dateObj =
    typeof date === "string" ? parse(date, "yyyy-MM-dd", new Date()) : date;

  // Obtener la hora actual en la zona horaria
  const now = toZonedTime(new Date(), tz);

  // Combinar la fecha con la hora actual
  const zonedDate = toZonedTime(dateObj, tz);
  zonedDate.setHours(
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );

  return format(zonedDate, "yyyy-MM-dd HH:mm:ss.SSS");
};

/**
 * Formatea una fecha con hora en medianoche (00:00:00.000)
 *
 * @param date - Objeto Date o fecha en formato "yyyy-MM-dd"
 * @param timezone - Zona horaria (por defecto: zona horaria del sistema)
 * @returns Fecha formateada como "yyyy-MM-dd 00:00:00.000"
 *
 * @example
 * formatDateWithMidnight(new Date()) // "2025-12-28 00:00:00.000"
 * formatDateWithMidnight("2025-12-20") // "2025-12-20 00:00:00.000"
 */
export const formatDateWithMidnight = (
  date: Date | string,
  timezone?: string
): string => {
  const tz = timezone || getUserTimezone();

  const dateObj =
    typeof date === "string" ? parse(date, "yyyy-MM-dd", new Date()) : date;

  const zonedDate = toZonedTime(dateObj, tz);

  return format(zonedDate, "yyyy-MM-dd 00:00:00.000");
};

/**
 * Formatea una fecha para envío al backend.
 * - Si es hoy: incluye la hora actual con milisegundos en la zona horaria local
 * - Si no es hoy: usa medianoche (00:00:00.000) en la zona horaria local
 *
 * Esta función es ideal para formularios de ventas, compras, pedidos, etc.
 * donde se necesita registrar la hora exacta solo para transacciones del día actual.
 *
 * @param dateString - Fecha en formato "yyyy-MM-dd"
 * @param timezone - Zona horaria (por defecto: zona horaria del sistema)
 * @returns Fecha formateada como "yyyy-MM-dd HH:mm:ss.SSS"
 *
 * @example
 * formatDateForSubmission("2025-12-28") // Si es hoy: "2025-12-28 11:19:54.511"
 * formatDateForSubmission("2025-12-20") // Si no es hoy: "2025-12-20 00:00:00.000"
 */
export const formatDateForSubmission = (
  dateString: string,
  timezone?: string
): string => {
  const tz = timezone || getUserTimezone();

  // Parsear la fecha del formulario
  const date = parse(dateString, "yyyy-MM-dd", new Date());

  // Convertir a la zona horaria correspondiente
  const zonedDate = toZonedTime(date, tz);

  // Si la fecha es hoy, usar la hora actual
  if (isToday(zonedDate)) {
    return formatDateWithCurrentTime(date, tz);
  }

  // Si no es hoy, usar medianoche
  return formatDateWithMidnight(date, tz);
};

/**
 * Formatea una fecha para envío al backend con zona horaria explícita (formato ISO).
 * Siempre incluye la información de zona horaria.
 *
 * @param dateString - Fecha en formato "yyyy-MM-dd"
 * @param timezone - Zona horaria (por defecto: zona horaria del sistema)
 * @returns Fecha formateada con zona horaria ISO
 *
 * @example
 * formatDateForSubmissionISO("2025-12-28") // "2025-12-28T11:19:54.511-04:00"
 * formatDateForSubmissionISO("2025-12-20") // "2025-12-20T00:00:00.000-04:00"
 */
export const formatDateForSubmissionISO = (
  dateString: string,
  timezone?: string
): string => {
  const tz = timezone || getUserTimezone();
  const date = parse(dateString, "yyyy-MM-dd", new Date());
  const zonedDate = toZonedTime(date, tz);

  if (isToday(zonedDate)) {
    const now = toZonedTime(new Date(), tz);
    return format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
  }

  return format(zonedDate, "yyyy-MM-dd'T'00:00:00.000XXX");
};

/**
 * Formatea múltiples fechas en un objeto.
 * Útil para formularios con varias fechas.
 *
 * @param data - Objeto con fechas a formatear
 * @param dateFields - Array de nombres de campos que son fechas
 * @param timezone - Zona horaria opcional
 * @returns Objeto con fechas formateadas
 *
 * @example
 * const formData = { fecha: "2025-12-28", fecha_entrega: "2025-12-30", nombre: "Juan" };
 * formatDatesInObject(formData, ["fecha", "fecha_entrega"]);
 * // { fecha: "2025-12-28 11:19:54.511", fecha_entrega: "2025-12-30 00:00:00.000", nombre: "Juan" }
 */
export const formatDatesInObject = <T extends Record<string, any>>(
  data: T,
  dateFields: (keyof T)[],
  timezone?: string
): T => {
  const formatted = { ...data };

  dateFields.forEach((field) => {
    if (formatted[field] && typeof formatted[field] === "string") {
      formatted[field] = formatDateForSubmission(
        formatted[field] as string,
        timezone
      ) as T[keyof T];
    }
  });

  return formatted;
};

/**
 * Convierte una fecha del backend (con hora) a formato de formulario (solo fecha)
 *
 * @param dateTimeString - Fecha con hora del backend (ej: "2025-12-28 11:19:54.511" o "2025-12-28T11:19:54.511Z")
 * @returns Fecha en formato "yyyy-MM-dd" para inputs de tipo date
 *
 * @example
 * parseDateFromBackend("2025-12-28 11:19:54.511") // "2025-12-28"
 * parseDateFromBackend("2025-12-28T11:19:54.511Z") // "2025-12-28"
 */
export const parseDateFromBackend = (dateTimeString: string): string => {
  if (!dateTimeString) return "";

  // Tomar solo los primeros 10 caracteres (yyyy-MM-dd)
  return dateTimeString.slice(0, 10);
};

/**
 * Convierte una fecha del backend (con hora) a formato de formulario (solo fecha)
 *
 * @param dateTimeString - Fecha con hora del backend (ej: "2025-12-28 11:19:54.511" o "2025-12-28T11:19:54.511Z")
 * @returns Fecha en formato "yyyy-MM-dd" para inputs de tipo date
 *
 */
export const parseDateForUi = (dateTimeString: string): string => {
  if (!dateTimeString) return "";
const tz =  getUserTimezone();
  const date = toZonedTime(new Date(dateTimeString), tz);
  return format(date, "dd/MM/yyyy");
};

/**
 * Obtiene la fecha actual en formato de formulario (yyyy-MM-dd)
 * Útil para inicializar campos de fecha en formularios
 *
 * @param timezone - Zona horaria (por defecto: zona horaria del sistema)
 * @returns Fecha actual en formato "yyyy-MM-dd"
 *
 * @example
 * getTodayDate() // "2025-12-28"
 */
export const getTodayDate = (timezone?: string): string => {
  const tz = timezone || getUserTimezone();
  const now = toZonedTime(new Date(), tz);
  return format(now, "yyyy-MM-dd");
};

/**
 * Obtiene la fecha actual con hora en formato completo
 *
 * @param timezone - Zona horaria (por defecto: zona horaria del sistema)
 * @returns Fecha y hora actual como "yyyy-MM-dd HH:mm:ss.SSS"
 *
 * @example
 * getTodayDateTime() // "2025-12-28 11:19:54.511"
 */
export const getTodayDateTime = (timezone?: string): string => {
  const tz = timezone || getUserTimezone();
  const now = toZonedTime(new Date(), tz);
  return format(now, "yyyy-MM-dd HH:mm:ss.SSS");
};

/**
 * Formatea una fecha para edición de registros existentes.
 * - Si la fecha no cambió: mantiene la fecha/hora original
 * - Si cambió a hoy: incluye la hora actual con milisegundos
 * - Si cambió a otra fecha: usa medianoche (00:00:00.000)
 *
 * Esta función es ideal para formularios de edición donde se debe preservar
 * la hora original de creación si el usuario no modifica la fecha.
 *
 * @param newDateString - Nueva fecha del formulario en formato "yyyy-MM-dd"
 * @param originalDateTime - Fecha/hora original del registro (del backend)
 * @param timezone - Zona horaria (por defecto: zona horaria del sistema)
 * @returns Fecha formateada como "yyyy-MM-dd HH:mm:ss.SSS"
 *
 * @example
 * // Fecha no cambió
 * formatDateForUpdate("2025-12-20", "2025-12-20 14:30:45.123")
 * // Retorna: "2025-12-20 14:30:45.123" (mantiene hora original)
 *
 * // Cambió a hoy
 * formatDateForUpdate("2025-12-28", "2025-12-20 14:30:45.123")
 * // Retorna: "2025-12-28 11:19:54.511" (hora actual)
 *
 * // Cambió a otra fecha
 * formatDateForUpdate("2025-12-25", "2025-12-20 14:30:45.123")
 * // Retorna: "2025-12-25 00:00:00.000" (medianoche)
 */
export const formatDateForUpdate = (
  newDateString: string,
  originalDateTime: string,
  timezone?: string
): string => {
  const tz = timezone || getUserTimezone();

  // Extraer solo la fecha de la fecha/hora original
  const originalDatePart = parseDateFromBackend(originalDateTime);

  // Si la fecha no cambió, mantener la fecha/hora original completa
  if (newDateString === originalDatePart) {
    return originalDateTime;
  }

  // Si cambió, usar la lógica de formatDateForSubmission
  return formatDateForSubmission(newDateString, tz);
};
