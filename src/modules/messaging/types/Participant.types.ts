import type { ParticipantRole } from "./Chat.types";

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT FULL DETAIL
// ─────────────────────────────────────────────────────────────────────────────

export interface Participant {
  id: number;
  usuario_id: number;
  nombre: string;
  email: string;
  rol: ParticipantRole;
  activo: boolean;
  silenciado: boolean;
  ultima_lectura: string;
  fecha_ingreso: string;
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