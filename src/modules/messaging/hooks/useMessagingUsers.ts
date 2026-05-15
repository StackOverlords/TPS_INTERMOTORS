/**
 * Regla de fuente de verdad:
 *  - presenceConnected === true  → online = onlineUserIds.has(id)  [Presence]
 *  - presenceConnected === false → online = u.online               [HTTP fallback]
 *
 * useUserAllSucursalesMap: devuelve Map<userId, sigla[]> con TODAS las sucursales
 * de cada usuario (no solo la primera), para mostrar los badges completos en la UI.
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
  enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resuelve si un usuario está online según la fuente de verdad correcta.
 * Si el canal de presencia está activo, el campo HTTP se ignora completamente.
 */
function resolveOnline(
  userId: number,
  httpOnline: boolean,
  onlineUserIds: Set<number>,
  presenceConnected: boolean,
): boolean {
  return presenceConnected ? onlineUserIds.has(userId) : httpOnline;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK BASE — grupos por sucursal (datos crudos)
// ─────────────────────────────────────────────────────────────────────────────

export function useMessagingUsers(options: UseMessagingUsersOptions = {}) {
  const { sucursal_id, buscar, enabled = true } = options;

  const query = useQuery({
    queryKey: [...MESSAGING_USERS_QUERY_KEY, sucursal_id, buscar],
    queryFn: () => messagingUserService.getAll({ sucursal_id, buscar }),
    staleTime: 1000 * 60 * 5,
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
// HOOK — lista plana deduplicada
// ─────────────────────────────────────────────────────────────────────────────

export function useMessagingUsersFlat(search?: string): {
  users: MessagingUser[];
  isLoading: boolean;
} {
  const { groups, isLoading } = useMessagingUsers({ enabled: true });
  const { onlineUserIds, presenceConnected, _tick } = usePresenceStore();
  const currentUserId = authSDK.getCurrentUser()?.id;

  const users = useMemo(() => {
    void _tick;

    const seen = new Set<number>();
    const flat: MessagingUser[] = [];

    for (const group of groups) {
      for (const u of group.usuarios) {
        if (seen.has(u.id)) continue;
        if (String(u.id) === String(currentUserId)) continue;
        seen.add(u.id);
        flat.push({
          ...u,
          online: resolveOnline(
            u.id,
            u.online,
            onlineUserIds,
            presenceConnected,
          ),
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
  }, [groups, onlineUserIds, presenceConnected, _tick, search, currentUserId]);

  return { users, isLoading };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — Map<userId, MessagingUser> para lookups O(1)
// ─────────────────────────────────────────────────────────────────────────────

export function useMessagingUserMap(): Map<number, MessagingUser> {
  const { groups } = useMessagingUsers({ enabled: true });
  const { onlineUserIds, presenceConnected, _tick } = usePresenceStore();

  return useMemo(() => {
    void _tick;
    const map = new Map<number, MessagingUser>();
    for (const group of groups) {
      for (const u of group.usuarios) {
        if (!map.has(u.id)) {
          map.set(u.id, {
            ...u,
            online: resolveOnline(
              u.id,
              u.online,
              onlineUserIds,
              presenceConnected,
            ),
          });
        }
      }
    }
    return map;
  }, [groups, onlineUserIds, presenceConnected, _tick]);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — Map<userId, sigla[]> con TODAS las sucursales del usuario
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve un mapa de userId → array de siglas de TODAS las sucursales
 * a las que pertenece ese usuario.
 *
 * Ejemplo: User 6 aparece en CENTRAL(CT) y SUCURSAL 1(S1)
 *   → map.get(6) === ["CT", "S1"]
 *
 * Usado en UserSelectorPanel y GroupSetupPanel para mostrar todos los
 * badges de sucursal en cada fila de usuario.
 */
export function useUserAllSucursalesMap(): Map<number, string[]> {
  const { groups } = useMessagingUsers({ enabled: true });

  return useMemo(() => {
    const map = new Map<number, string[]>();
    for (const group of groups) {
      for (const u of group.usuarios) {
        const existing = map.get(u.id) ?? [];
        if (!existing.includes(group.sucursal.sigla)) {
          map.set(u.id, [...existing, group.sucursal.sigla]);
        }
      }
    }
    return map;
  }, [groups]);
}

// Alias mantenido por compatibilidad con GroupSetupPanel existente
export function useUserSucursalMap(): Map<number, string> {
  const allMap = useUserAllSucursalesMap();
  return useMemo(() => {
    const map = new Map<number, string>();
    allMap.forEach((siglas, id) => map.set(id, siglas[0] ?? ""));
    return map;
  }, [allMap]);
}
