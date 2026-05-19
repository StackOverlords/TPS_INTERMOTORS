/**
 * Hook que expone el estado de mute reactivo y el control de sonidos.
 * Úsalo en cualquier componente que necesite mostrar o cambiar el estado
 * de silenciado (ej: botón en el header del chat o en settings).
 *
 * Los sonidos se disparan desde:
 *  - useSendMessage  → play('sent')     al confirmar el envío
 *  - useMessagingWebSocket → play('received') al recibir mensaje de otro usuario
 */
import { useCallback, useSyncExternalStore } from "react";
import { soundManager } from "../utils/soundManager";

// ─────────────────────────────────────────────────────────────────────────────
// Mini external store para que React reaccione al cambio de mute
// ─────────────────────────────────────────────────────────────────────────────

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return soundManager.isMuted;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useChatSounds() {
  const isMuted = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggleMute = useCallback(() => {
    soundManager.toggle();
    notifyListeners(); // notificar a todos los componentes suscritos
  }, []);

  const mute = useCallback(() => {
    soundManager.mute();
    notifyListeners();
  }, []);
  const unmute = useCallback(() => {
    soundManager.unmute();
    notifyListeners();
  }, []);

  return { isMuted, toggleMute, mute, unmute };
}
