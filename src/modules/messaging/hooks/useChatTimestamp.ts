/**
 * Devuelve el timestamp formateado y se refresca automáticamente.
 *
 * El intervalo se calibra inteligentemente:
 * - Si el mensaje es de hoy → refresca cada 60 s (podría cambiar de minuto)
 * - Si es de ayer o más viejo → refresca cada hora (solo importa si cambia el día)
 *
 * Esto evita tener 50 setInterval de 1 s corriendo en la lista de chats.
 */

import { useEffect, useState } from "react";
import { formatChatTimestamp } from "../utils/chatTime";

export function useChatTimestamp(date: Date | string | number): string {
  const [formatted, setFormatted] = useState(() => formatChatTimestamp(date));

  useEffect(() => {
    const d = new Date(date);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    // Si es de hoy refrescamos cada minuto, si no cada hora
    const intervalMs = isToday ? 60_000 : 3_600_000;

    const tick = () => setFormatted(formatChatTimestamp(date));
    const id = setInterval(tick, intervalMs);

    // Recalcular inmediatamente por si cambió desde el montaje
    tick();

    return () => clearInterval(id);
  }, [date]);

  return formatted;
}
