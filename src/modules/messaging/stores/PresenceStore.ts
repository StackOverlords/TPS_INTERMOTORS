/**
 * Estado de presencia (online/offline) de usuarios via Presence Channel.
 *
 * Fuente de verdad:
 *  - presenceConnected === true  → SOLO el Set onlineUserIds define quién está online.
 *                                  El campo `online` del HTTP se ignora completamente.
 *  - presenceConnected === false → Se usa el campo `online` del HTTP como fallback
 *                                  (polling cada 5 min que hace el backend).
 *
 * presenceConnected se activa con el primer evento `here` del canal presence-users
 * y se desactiva al hacer reset (logout).
 */
import { create } from "zustand";

interface PresenceState {
  onlineUserIds: Set<number>;
  /** true en cuanto recibimos el primer evento `here` del canal de presencia */
  presenceConnected: boolean;
  /**
   * Incrementa con cada mutación del Set para forzar re-renders.
   * Zustand no detecta cambios internos de Set de forma reactiva.
   */
  _tick: number;
}

interface PresenceActions {
  /** Llamar con la lista inicial cuando Echo hace join (evento `here`) */
  setInitialUsers: (users: Array<{ id: number }>) => void;
  /** Usuario entró al canal (evento `joining`) */
  userJoined: (user: { id: number }) => void;
  /** Usuario salió del canal (evento `leaving`) */
  userLeft: (user: { id: number }) => void;
  /** Verificar si un usuario está online (lectura directa, sin reactividad) */
  isOnline: (userId: number) => boolean;
  /** Resetear al hacer logout */
  reset: () => void;
}

const initialState: PresenceState = {
  onlineUserIds: new Set(),
  presenceConnected: false,
  _tick: 0,
};

export const usePresenceStore = create<PresenceState & PresenceActions>()(
  (set, get) => ({
    ...initialState,

    setInitialUsers: (users) =>
      set({
        onlineUserIds: new Set(users.map((u) => u.id)),
        presenceConnected: true, // ← primer evento here = canal activo
        _tick: get()._tick + 1,
      }),

    userJoined: (user) =>
      set((state) => {
        const next = new Set(state.onlineUserIds);
        next.add(user.id);
        return { onlineUserIds: next, _tick: state._tick + 1 };
      }),

    userLeft: (user) =>
      set((state) => {
        const next = new Set(state.onlineUserIds);
        next.delete(user.id);
        return { onlineUserIds: next, _tick: state._tick + 1 };
      }),

    isOnline: (userId) => get().onlineUserIds.has(userId),

    reset: () => set(initialState),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// SELECTOR HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook reactivo para saber si un usuario específico está online.
 *
 * Usa _tick como proxy para re-evaluar cuando cambia el Set.
 * Seguro de llamar dentro de componentes — pero NO dentro de .map() directamente;
 * siempre usarlo en el cuerpo de un componente React.
 */
export function useIsOnline(userId: number | undefined): boolean {
  return usePresenceStore((s) => {
    if (!userId) return false;
    void s._tick; // dependencia reactiva
    return s.onlineUserIds.has(userId);
  });
}
