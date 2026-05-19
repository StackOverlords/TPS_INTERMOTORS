// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

import type { Attachment } from "./Attachment.types";
import type { LastMessagePreview } from "./Chat.types";

export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";

export type MessageSubtipo =
  | "participant_added"
  | "participant_removed"
  | "user_left"
  | "group_name_updated"
  | "group_description_updated"
  | "group_deleted"
  | null;

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
  | "almacen_out"
  | "almacen_in"
  | "sale"
  | "purchase"
  | "transfer"
  | string;

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  chat_id: number;
  tipo: MessageType;
  tipo_label: string | null;
  subtipo: MessageSubtipo; // null en mensajes normales
  actor_id: number | null;
  contenido: string;
  referencia_tipo: ReferenciaTipo | null;
  referencia_id: number | null;
  remitente: MessageSender | null; // null cuando es_sistema
  es_sistema: boolean;
  editado: boolean;
  fecha_reg: string; // ISO date
  fecha_editado: string | null; // ISO date, solo si editado === true
  /** Archivos adjuntos — vacío para mensajes de texto */
  adjuntos: Attachment[];
  /** Eliminado localmente (para_todos = false — solo afecta al usuario actual) */
  eliminado?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMISTIC MESSAGE (para envío con estado local)
// ─────────────────────────────────────────────────────────────────────────────

export type MessageStatus =
  | "sending"
  | "uploading"
  | "sent"
  | "failed"
  | "queued";

export interface OptimisticMessage extends Message {
  _tempId: string;
  _status: MessageStatus;
  /** Progreso de subida 0–100, solo cuando _status === 'uploading' */
  _progress?: number;
  /** URL local temporal (objectURL) para preview de imágenes antes de subir */
  _localPreviewUrl?: string;
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
// EDIT PAYLOAD
// ─────────────────────────────────────────────────────────────────────────────

export interface EditMessagePayload {
  contenido: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBSOCKET EVENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Payload del evento .message.edited */
export interface MessageEditedEvent {
  id: number;
  chat_id: number;
  contenido: string;
  editado: true;
  fecha_editado: string;
}

/** Payload del evento .message.deleted */
export interface MessageDeletedEvent {
  id: number;
  chat_id: number;
  eliminado_para: "todos" | "mi";
  latest_message: LastMessagePreview | null;
  no_leidos?: number;
}

/** Payload del evento .chat.updated */
export interface ChatUpdatedEvent {
  id: number;
  nombre: string;
  descripcion: string | null;
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

export interface DeleteForMeResponse {
  message: string;
  latest_message: LastMessagePreview | null;
}
