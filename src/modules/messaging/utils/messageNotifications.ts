import type { Message, MessageSubtipo } from "../types/Message.types";

/** Subtipos que NUNCA incrementan el badge ni reproducen sonido */
const SILENT_SUBTYPES: NonNullable<MessageSubtipo>[] = [
  "group_name_updated",
  "group_description_updated",
];

/** Subtipos que incrementan badge pero NO reproducen sonido */
const BADGE_NO_SOUND_SUBTYPES: NonNullable<MessageSubtipo>[] = [
  "participant_added",
  "participant_removed",
  "user_left",
];

export interface NotificationBehavior {
  badge: boolean;
  sound: boolean;
}

/**
 * Dado un mensaje y el id del usuario actual, devuelve si debe
 * incrementar el badge de no leídos y/o reproducir sonido.
 *
 * Reglas (en orden de prioridad):
 *  1. Si soy el actor (authUserId === message.actor_id) → sin badge, sin sonido
 *  2. Si es mensaje propio (authUserId === message.remitente?.id) → sin badge, sin sonido
 *  3. Si el subtipo está en SILENT_SUBTYPES → sin badge, sin sonido
 *  4. Si el subtipo está en BADGE_NO_SOUND_SUBTYPES → badge sí, sonido no
 *  5. Resto (mensajes normales y de sistema sin subtipo conocido) → badge sí, sonido sí
 */
export function resolveNotificationBehavior(
  message: Message,
  authUserId: number,
): NotificationBehavior {
  // Regla 1 — fui yo quien causó el mensaje de sistema
  if (message.actor_id !== null && message.actor_id === authUserId) {
    return { badge: false, sound: false };
  }

  // Regla 2 — es un mensaje que yo mismo envié
  if (message.remitente?.id === authUserId) {
    return { badge: false, sound: false };
  }

  // Regla 3 — subtipo completamente silencioso
  if (message.subtipo && SILENT_SUBTYPES.includes(message.subtipo)) {
    return { badge: false, sound: false };
  }

  // Regla 4 — subtipo con badge pero sin sonido
  if (message.subtipo && BADGE_NO_SOUND_SUBTYPES.includes(message.subtipo)) {
    return { badge: true, sound: false };
  }

  // Regla 5 — comportamiento normal
  return { badge: true, sound: true };
}
