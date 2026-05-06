// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type ChatType = 'DIRECT' | 'GROUP' | 'CHANNEL';
export type ParticipantRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPATION
// ─────────────────────────────────────────────────────────────────────────────

export interface MyParticipation {
  rol: ParticipantRole;
  puede_escribir: boolean;
  silenciado: boolean;
  ultima_lectura: string; // ISO date
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatParticipant {
  id: number;
  nombre: string;
  rol: ParticipantRole;
  activo: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAST MESSAGE PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

export interface LastMessagePreview {
  id: number;
  contenido: string;
  remitente?: { id: number; nombre: string } | null;
  fecha_reg: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────────────────────

export interface Chat {
  id: number;
  tipo: ChatType;
  tipo_label: string;
  nombre: string;
  descripcion: string | null;
  es_sistema: boolean;
  mi_participacion: MyParticipation;
  participantes: ChatParticipant[];
  ultimo_mensaje: LastMessagePreview | null;
  no_leidos: number;
  fecha_reg: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PAYLOADS
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateDirectChatPayload {
  usuario_id: number;
}

export interface CreateGroupPayload {
  nombre: string;
  descripcion?: string;
  sucursal: number;
  participantes: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatsGetAllResponse {
  data: Chat[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}