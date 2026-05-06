import { z } from 'zod';

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
  tipo: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']),
  contenido: z.string(),
  referencia_tipo: z.string().nullable(),
  referencia_id: z.number().nullable(),
  remitente: messageSenderSchema.nullable(),
  es_sistema: z.boolean(),
  editado: z.boolean(),
  fecha_reg: z.string(),
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
    .string({ required_error: 'El mensaje no puede estar vacío' })
    .min(1, 'El mensaje no puede estar vacío')
    .max(5000, 'Máximo 5000 caracteres'),
  referencia_tipo: z.string().optional(),
  referencia_id: z.number().optional(),
});

export type SendMessageFormValues = z.infer<typeof sendMessageSchema>;