// ─────────────────────────────────────────────────────────────────────────────
// Diferente al User general del módulo de usuarios — es una vista simplificada
// pensada para el chat, agrupada por sucursal.
// ─────────────────────────────────────────────────────────────────────────────

export interface MessagingUserSucursal {
  id: number;
  nombre: string;
  sigla: string;
}

export interface MessagingUser {
  id: number;
  nombre: string;
  nickname: string;
  /** Valor HTTP (último request en los últimos 5 min). Para tiempo real usar PresenceStore. */
  online: boolean;
  last_seen_at: string | null;
}

export interface MessagingUserGroup {
  sucursal: MessagingUserSucursal;
  usuarios: MessagingUser[];
}

export type MessagingUsersResponse = MessagingUserGroup[];
