/**
 * Componentes reutilizables de presencia para el módulo de mensajería.
 *
 * Exports:
 *  - getPresenceLevel()  → función utilitaria que calcula el nivel (online/recent/away)
 *  - OnlineDot           → indicador circular de color (verde/ámbar/gris)
 *  - LastSeenLabel       → texto de última conexión estilo WhatsApp en español
 */
import { cn } from "@/lib/utils";
import {
  format,
  isToday,
  isYesterday,
  differenceInMinutes,
  isThisWeek,
} from "date-fns";
import { es } from "date-fns/locale";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & THRESHOLDS
// ─────────────────────────────────────────────────────────────────────────────

export type PresenceLevel = "online" | "recent" | "away";

const RECENT_THRESHOLD_MIN = 60; // < 60 min → "reciente" (ámbar)

/**
 * Calcula el nivel de presencia a partir de los datos del API.
 *
 * - online   → el backend marcó al usuario como activo ahora mismo
 * - recent   → offline pero visto hace menos de 60 minutos
 * - away     → offline hace más de 60 min o sin registro de last_seen_at
 */
export function getPresenceLevel(
  online: boolean,
  lastSeenAt: string | null
): PresenceLevel {
  if (online) return "online";
  if (!lastSeenAt) return "away";

  const diffMin = differenceInMinutes(new Date(), new Date(lastSeenAt));
  return diffMin < RECENT_THRESHOLD_MIN ? "recent" : "away";
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR MAP (compatible dark + light)
// ─────────────────────────────────────────────────────────────────────────────

const DOT_COLORS: Record<PresenceLevel, string> = {
  online: "bg-emerald-500",
  recent: "bg-amber-400",
  away: "bg-slate-300 dark:bg-slate-500",
};

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE DOT
// ─────────────────────────────────────────────────────────────────────────────

interface OnlineDotProps {
  online: boolean;
  lastSeenAt?: string | null;
  className?: string;
  /** Por defecto false. Si true, agrega un ring para distinguirlo del fondo. */
  withRing?: boolean;
}

/**
 * Indicador circular de presencia.
 *
 * 🟢 Emerald  → online ahora mismo
 * 🟡 Amber    → visto hace menos de 60 minutos
 * ⚫ Slate    → sin actividad reciente o sin last_seen_at
 */
export function OnlineDot({
  online,
  lastSeenAt = null,
  className,
  withRing = true,
}: OnlineDotProps) {
  const level = getPresenceLevel(online, lastSeenAt);
  const color = DOT_COLORS[level];

  return (
    <span
      className={cn(
        "block shrink-0 rounded-full",
        color,
        withRing && "ring-2 ring-background",
        className
      )}
      aria-label={
        level === "online"
          ? "En línea"
          : level === "recent"
            ? "Activo recientemente"
            : "Desconectado"
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAST SEEN LABEL
// ─────────────────────────────────────────────────────────────────────────────

const DAYS_ABBR = ["dom.", "lun.", "mar.", "mié.", "jue.", "vie.", "sáb."];

/**
 * Formatea la fecha de última conexión.
 *
 * Formatos:
 *  - Online          → "En línea"
 *  - < 2 min         → "Visto hace un momento"
 *  - < 60 min        → "Visto hace X min"
 *  - Hoy             → "Visto hoy a las HH:mm"
 *  - Ayer            → "Visto ayer a las HH:mm"
 *  - Esta semana     → "Visto el lun. a las HH:mm"
 *  - Más antiguo     → "Visto el DD/MM/YYYY"
 *  - Sin registro    → "Sin actividad registrada"
 */
export function formatLastSeen(
  online: boolean,
  lastSeenAt: string | null
): string {
  if (online) return "En línea";
  if (!lastSeenAt) return "Sin actividad registrada";

  const date = new Date(lastSeenAt);

  // Validar que la fecha sea válida
  if (isNaN(date.getTime())) return "Sin actividad registrada";

  const diffMin = differenceInMinutes(new Date(), date);

  if (diffMin < 2) return "Última vez hace un momento";
  if (diffMin < 60) return `Última vez hace ${diffMin} min`;

  const timeStr = format(date, "HH:mm", { locale: es });

  if (isToday(date)) return `Última vez hoy a las ${timeStr}`;
  if (isYesterday(date)) return `Última vez ayer a las ${timeStr}`;
  if (isThisWeek(date, { locale: es })) {
    const dayName = DAYS_ABBR[date.getDay()];
    return `Última vez el ${dayName} a las ${timeStr}`;
  }

  const dateStr = format(date, "dd/MM/yyyy", { locale: es });
  return `Última vez el ${dateStr}`;
}

interface LastSeenLabelProps {
  online: boolean;
  lastSeenAt?: string | null;
  className?: string;
}

/**
 * Componente de texto de última conexión.
 * El color cambia según el nivel de presencia para reforzar el indicador visual.
 */
export function LastSeenLabel({
  online,
  lastSeenAt = null,
  className,
}: LastSeenLabelProps) {
  const level = getPresenceLevel(online, lastSeenAt);
  const text = formatLastSeen(online, lastSeenAt);

  return (
    <span
      className={cn(
        "text-[11px] leading-none",
        level === "online" &&
          "text-emerald-600 dark:text-emerald-400 font-medium",
        level === "recent" && "text-amber-600 dark:text-amber-400",
        level === "away" && "text-muted-foreground",
        className
      )}
    >
      {text}
    </span>
  );
}
