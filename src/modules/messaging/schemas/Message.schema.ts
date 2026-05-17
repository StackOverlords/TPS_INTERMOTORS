import { z } from "zod";
import { lastMessagePreviewSchema } from "./Chat.schema";

export const deleteForMeResponseSchema = z.object({
  message: z.string(),
  latest_message: lastMessagePreviewSchema.nullable(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTACHMENT
// ─────────────────────────────────────────────────────────────────────────────

export const attachmentSchema = z.object({
  id: z.number(),
  nombre_original: z.string(),
  tipo_mime: z.string(),
  extension: z.string(),
  tamanio: z.number(),
  es_imagen: z.boolean(),
  url: z.string(),
  url_thumbnail: z.string().nullable(),
  ancho: z.number().nullable(),
  alto: z.number().nullable(),
});

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

export const messageSenderSchema = z.object({
  id: z.number(),
  nombre: z.string(),
});

export const messageSchema = z.object({
  id: z.number(),
  chat_id: z.number(),
  tipo: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]),
  tipo_label: z.string().nullable(),
  subtipo: z
    .enum([
      "participant_added",
      "participant_removed",
      "user_left",
      "group_name_updated",
      "group_description_updated",
    ])
    .nullable(),
  actor_id: z.number().nullable(),
  contenido: z.string(),
  referencia_tipo: z.string().nullable(),
  referencia_id: z.number().nullable(),
  remitente: messageSenderSchema.nullable(),
  es_sistema: z.boolean(),
  editado: z
    .boolean()
    .nullable()
    .transform((v) => v ?? false),
  fecha_editado: z.string().nullable(),
  fecha_reg: z.string(),
  adjuntos: z.array(attachmentSchema).optional().default([]),
});

export const messagesGetAllResponseSchema = z.object({
  data: z.array(messageSchema),
  meta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    last_page: z.number(),
  }),
});

export const pollResponseSchema = z.object({
  data: z.array(messageSchema),
  timestamp: z.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// FORM SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  contenido: z
    .string({ required_error: "El mensaje no puede estar vacío" })
    .min(1, "El mensaje no puede estar vacío")
    .max(10000, "Máximo 10000 caracteres"),
  referencia_tipo: z.string().optional(),
  referencia_id: z.number().optional(),
});

export type SendMessageFormValues = z.infer<typeof sendMessageSchema>;
