import type { ParticipantRole } from "./Chat.types";

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT FULL DETAIL
// ─────────────────────────────────────────────────────────────────────────────

export interface ParticipantUser {
  id: number;
  nombre: string;
}
export interface Participant {
  id: number;
  chat_id: number;
  rol: ParticipantRole;
  rol_label: string;
  activo: boolean;
  puede_escribir: boolean;
  silenciado: boolean;
  ultima_lectura: string;
  fecha_ingreso: string;
  usuario: ParticipantUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYLOADS
// ─────────────────────────────────────────────────────────────────────────────

export interface AddParticipantPayload {
  usuario_id: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

export interface ParticipantsResponse {
  data: Participant[];
}

export interface ParticipantRemovedEvent {
  chat_id: number;
  usuario_id: number; // quién fue removido
  removido_por: number; // quién lo removió (igual a usuario_id si fue voluntario)
  voluntario: boolean; // true = salió solo, false = fue expulsado
}
