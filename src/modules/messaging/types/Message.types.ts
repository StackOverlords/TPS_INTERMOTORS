// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE SENDER
// ─────────────────────────────────────────────────────────────────────────────

export interface MessageSender {
  id: number;
  nombre: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE (vinculación a entidades del negocio)
// ─────────────────────────────────────────────────────────────────────────────

export type ReferenciaTipo =
  | 'almacen_out'
  | 'almacen_in'
  | 'sale'
  | 'purchase'
  | 'transfer'
  | string;

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  chat_id: number;
  tipo: MessageType;
  contenido: string;
  referencia_tipo: ReferenciaTipo | null;
  referencia_id: number | null;
  remitente: MessageSender | null; // null cuando es_sistema
  es_sistema: boolean;
  editado: boolean;
  fecha_reg: string; // ISO date
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMISTIC MESSAGE (para envío con estado local)
// ─────────────────────────────────────────────────────────────────────────────

export type MessageStatus = 'sending' | 'sent' | 'failed' | 'queued';

export interface OptimisticMessage extends Message {
  _tempId: string;
  _status: MessageStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  contenido: string;
  referencia_tipo?: ReferenciaTipo;
  referencia_id?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE QUEUE ITEM (para Tauri store)
// ─────────────────────────────────────────────────────────────────────────────

export interface OfflineQueueItem {
  tempId: string;
  chatId: number;
  payload: SendMessagePayload;
  createdAt: string;
  attempts: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

export interface MessagesGetAllResponse {
  data: Message[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface PollResponse {
  data: Message[];
  timestamp: string;
}