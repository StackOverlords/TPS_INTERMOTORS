/**
 * Formatea una fecha al estilo que usan las apps de mensajería:
 * - Hoy        → "14:32"  (hora exacta)
 * - Ayer       → "ayer"
 * - Esta semana (2–6 días) → "lunes", "martes"...
 * - Más antiguo → "09/05/26"
 *
 * @param date  Fecha del mensaje (ISO string, Date, o number)
 * @param now   Override del "ahora" — útil para tests unitarios
 */

const DAYS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

export function formatChatTimestamp(
  date: Date | string | number,
  now: Date = new Date(),
): string {
  const d = new Date(date);

  // Normalizar a medianoche local — evita bugs de comparación por horas
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sixAgo = new Date(today);
  sixAgo.setDate(today.getDate() - 6);
  const dayOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dayOfMsg.getTime() === today.getTime()) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  if (dayOfMsg.getTime() === yesterday.getTime()) {
    return "ayer";
  }
  if (dayOfMsg.getTime() >= sixAgo.getTime()) {
    return DAYS_ES[d.getDay()];
  }

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/**
 * Texto para el separador de fecha entre mensajes (badge centrado).
 * - Hoy          → "Hoy"
 * - Ayer         → "Ayer"
 * - Esta semana  → "lunes 5 de mayo"
 * - Mismo año    → "9 de marzo"
 * - Año distinto → "9 de mayo de 2024"
 */
export function formatDateSeparator(
  date: Date | string | number,
  now: Date = new Date(),
): string {
  const d = new Date(date);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dayOfMsg.getTime() === today.getTime()) return "Hoy";
  if (dayOfMsg.getTime() === yesterday.getTime()) return "Ayer";

  const sameYear = d.getFullYear() === now.getFullYear();

  // "lunes 5 de mayo" si es esta semana, "9 de marzo" si es mismo año
  const diffDays = Math.floor(
    (today.getTime() - dayOfMsg.getTime()) / 86_400_000,
  );

  if (diffDays <= 6) {
    // "lunes 5 de mayo"
    return d.toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  if (sameYear) {
    // "9 de marzo"
    return d.toLocaleDateString("es", { day: "numeric", month: "long" });
  }

  // "9 de mayo de 2024"
  return d.toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
