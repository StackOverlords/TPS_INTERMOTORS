import { format, parse } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

/**
 * Extrae "yyyy-MM-dd" de cualquier datetime string del backend.
 * Compatible con "2026-05-22 10:30:00", "2026-05-22T10:30:00Z", "2026-05-22".
 */
export const parseDateFromBackend = (dateTimeString: string): string => {
  if (!dateTimeString) return "";
  return dateTimeString.slice(0, 10);
};

/**
 * Convierte un datetime del backend a formato visual "dd/MM/yyyy".
 * Usa solo la parte de fecha para evitar shifts por UTC.
 */
export const parseDateForUi = (dateTimeString: string): string => {
  if (!dateTimeString) return "";
  return formatDateOnly(dateTimeString.slice(0, 10));
};

/**
 * Obtiene la fecha actual como "yyyy-MM-dd" en la zona horaria del sistema.
 */
export const getTodayDate = (timezone?: string): string => {
  const tz = timezone || getUserTimezone();
  const now = toZonedTime(new Date(), tz);
  return format(now, "yyyy-MM-dd");
};

/**
 * Envía la fecha al backend directamente como "yyyy-MM-dd".
 * El backend con APP_TIMEZONE=America/La_Paz la interpreta correctamente.
 */
export const formatDateForSubmission = (dateString: string): string => {
  return dateString;
};

/**
 * Para edición: preserva el datetime original si la fecha no cambió,
 * o envía la nueva "yyyy-MM-dd" si cambió (el backend maneja el timezone).
 */
export const formatDateForUpdate = (
  newDateString: string,
  originalDateTime: string
): string => {
  const originalDatePart = parseDateFromBackend(originalDateTime);
  if (newDateString === originalDatePart) {
    return originalDateTime;
  }
  return newDateString;
};

/**
 * Formatea "yyyy-MM-dd" como "dd/MM/yyyy" para visualización.
 */
export const formatDateOnly = (dateString: string): string => {
  if (!dateString) return "";
  const parsed = parse(dateString, "yyyy-MM-dd", new Date());
  return format(parsed, "dd/MM/yyyy");
};
