/**
 * Usa el endpoint propio GET /messaging/users que devuelve usuarios
 * agrupados por sucursal con estado online/last_seen_at.
 *
 * Dos variantes:
 *  - useMessagingUsers()       → grupos completos por sucursal
 *  - useMessagingUsersFlat()   → lista plana, sin duplicados, con online en tiempo real
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { messagingUserService } from "../service/MessagingUser.service";
import type {
  MessagingUser,
  MessagingUserGroup,
} from "../types/MessagingUser.types";
import { usePresenceStore } from "../stores/PresenceStore";
import authSDK from "@/services/sdk-simple-auth";

export const MESSAGING_USERS_QUERY_KEY = ["messaging", "users"] as const;

export interface UseMessagingUsersOptions {
  sucursal_id?: number;
  buscar?: string;
  /** Por defecto true. Pasar false para deshabilitar (ej: componentes no montados) */
  enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — grupos por sucursal
// ─────────────────────────────────────────────────────────────────────────────

export function useMessagingUsers(options: UseMessagingUsersOptions = {}) {
  const { sucursal_id, buscar, enabled = true } = options;

  const query = useQuery({
    queryKey: [...MESSAGING_USERS_QUERY_KEY, sucursal_id, buscar],
    queryFn: () => messagingUserService.getAll({ sucursal_id, buscar }),
    staleTime: 1000 * 60 * 5, // 5 min — online se actualiza por presencia
    enabled,
  });

  return {
    groups: (query.data ?? []) as MessagingUserGroup[],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — lista plana sin duplicados
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lista plana de usuarios, filtrada por búsqueda, sin duplicados,
 * con el estado online sobreescrito por el Presence Channel en tiempo real.
 *
 * Si no hay Presence Channel activo, cae back al campo `online` del API.
 */
export function useMessagingUsersFlat(search?: string): {
  users: MessagingUser[];
  isLoading: boolean;
} {
  const { groups, isLoading } = useMessagingUsers({ enabled: true });
  // _tick hace que este selector se re-evalúe cuando cambia el Set de presencia
  const { onlineUserIds, _tick } = usePresenceStore();
  const currentUserId = authSDK.getCurrentUser()?.id;

  const users = useMemo(() => {
    void _tick; // dependencia reactiva del Set

    const seen = new Set<number>();
    const flat: MessagingUser[] = [];

    for (const group of groups) {
      for (const u of group.usuarios) {
        if (seen.has(u.id)) continue;
        // Excluir al usuario autenticado (el backend ya lo hace, pero doble check)
        if (String(u.id) === String(currentUserId)) continue;
        seen.add(u.id);
        flat.push({
          ...u,
          // Presence tiene prioridad sobre el campo HTTP
          online: onlineUserIds.has(u.id) || u.online,
        });
      }
    }

    if (!search?.trim()) return flat;

    const lower = search.toLowerCase();
    return flat.filter(
      (u) =>
        u.nombre.toLowerCase().includes(lower) ||
        u.nickname.toLowerCase().includes(lower),
    );
  }, [groups, onlineUserIds, _tick, search, currentUserId]);

  return { users, isLoading };
}

/** Map<userId, MessagingUser> con online en tiempo real para lookups O(1). */
export function useMessagingUserMap(): Map<number, MessagingUser> {
  const { groups } = useMessagingUsers({ enabled: true });
  const { onlineUserIds, _tick } = usePresenceStore();

  return useMemo(() => {
    void _tick;
    const map = new Map<number, MessagingUser>();
    for (const group of groups) {
      for (const u of group.usuarios) {
        if (!map.has(u.id)) {
          map.set(u.id, { ...u, online: onlineUserIds.has(u.id) || u.online });
        }
      }
    }
    return map;
  }, [groups, onlineUserIds, _tick]);
}

/** Map<userId, sucursalSigla> — primera sucursal donde aparece el usuario. */
export function useUserSucursalMap(): Map<number, string> {
  const { groups } = useMessagingUsers({ enabled: true });
  return useMemo(() => {
    const map = new Map<number, string>();
    for (const group of groups) {
      for (const u of group.usuarios) {
        if (!map.has(u.id)) map.set(u.id, group.sucursal.sigla);
      }
    }
    return map;
  }, [groups]);
}
