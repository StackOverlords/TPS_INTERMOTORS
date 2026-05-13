/**
 * PresenceStore — estado de presencia (online/offline) de usuarios.
 *
 * Fuente primaria: Presence Channel de Reverb/Echo (presence-users).
 * Fuente secundaria: campo `online` de GET /messaging/users (usado antes
 * de que Echo se conecte o como fallback si Reverb no está disponible).
 *
 * El store usa un Set<number> para O(1) lookups por userId.
 * Zustand no maneja Sets de forma reactiva por defecto, así que
 * guardamos también un counter que cambia en cada mutación para
 * forzar re-renders en los componentes suscritos.
 */
import { create } from "zustand";

interface PresenceState {
  /** IDs de usuarios actualmente online */
  onlineUserIds: Set<number>;
  /** Incrementa con cada cambio para forzar re-renders */
  _tick: number;
}

interface PresenceActions {
  /** Llamar con la lista inicial de presencia (evento `here`) */
  setInitialUsers: (users: Array<{ id: number }>) => void;
  /** Llamar cuando un usuario entra (evento `joining`) */
  userJoined: (user: { id: number }) => void;
  /** Llamar cuando un usuario sale (evento `leaving`) */
  userLeft: (user: { id: number }) => void;
  /** Verificar si un usuario está online */
  isOnline: (userId: number) => boolean;
  /** Resetear al hacer logout */
  reset: () => void;
}

const initialState: PresenceState = {
  onlineUserIds: new Set(),
  _tick: 0,
};

export const usePresenceStore = create<PresenceState & PresenceActions>()(
  (set, get) => ({
    ...initialState,

    setInitialUsers: (users) =>
      set({
        onlineUserIds: new Set(users.map((u) => u.id)),
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
// SELECTOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook para saber si un usuario específico está online.
 * Se re-renderiza solo cuando cambia el estado de CUALQUIER usuario
 * (por limitación de Set en Zustand — usamos _tick como proxy).
 *
 * Para componentes que muestran MUCHOS usuarios (listas), es más eficiente
 * usar usePresenceStore.getState().isOnline(id) en renders estáticos.
 */
export function useIsOnline(userId: number | undefined): boolean {
  return usePresenceStore((s) => {
    if (!userId) return false;
    // _tick incluido para que el selector re-evalúe al cambiar el Set
    void s._tick;
    return s.onlineUserIds.has(userId);
  });
}
