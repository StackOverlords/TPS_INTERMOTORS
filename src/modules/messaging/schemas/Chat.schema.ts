import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

const chatParticipantSchema = z.object({
  id: z.number(),
  chat_id: z.number(),
  rol: z.enum(["OWNER", "ADMIN", "MEMBER"]),
  puede_escribir: z.boolean(),
  silenciado: z.boolean(),
  ultima_lectura: z.string().nullable(),
  fecha_ingreso: z.string(),
  usuario: z.object({
    id: z.number(),
    nombre: z.string(),
    activo: z.boolean().optional(),
  }),
});

const myParticipationSchema = z.object({
  rol: z.enum(["OWNER", "ADMIN", "MEMBER"]),
  puede_escribir: z.boolean(),
  silenciado: z.boolean(),
  ultima_lectura: z.string().nullable(),
  fecha_salida: z.string().nullable(),
});

export const lastMessagePreviewSchema = z.object({
  id: z.number(),
  contenido: z.string(),
  tipo: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM"]).optional(),
  tipo_label: z.string().nullable(),
  referencia_tipo: z.string().nullable(),
  referencia_id: z.number().nullable(),
  es_sistema: z.boolean(),
  editado: z
    .boolean()
    .nullable()
    .transform((v) => v ?? false),
  fecha_editado: z.string().nullable(),
  remitente: z
    .object({ id: z.number(), nombre: z.string() })
    .nullable()
    .optional(),
  fecha_reg: z.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────────────────────

export const chatSchema = z.object({
  id: z.number(),
  tipo: z.enum(["DIRECT", "GROUP", "CHANNEL"]),
  tipo_label: z.string(),
  nombre: z
    .string()
    .nullable()
    .transform((v) => v ?? ""),
  descripcion: z.string().nullable(),
  es_sistema: z.boolean(),
  mi_participacion: myParticipationSchema,
  participantes: z.array(chatParticipantSchema),
  ultimo_mensaje: lastMessagePreviewSchema.nullable(),
  no_leidos: z.number().default(0),
  fecha_reg: z.string(),
});

export const chatsGetAllResponseSchema = z.object({
  data: z.array(chatSchema),
  meta: z
    .object({
      current_page: z.number(),
      per_page: z.number(),
      total: z.number(),
      last_page: z.number(),
    })
    .optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// FORM SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const createDirectChatSchema = z.object({
  usuario_id: z.number({ required_error: "El usuario es requerido" }),
});

export const createGroupSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es requerido" })
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  descripcion: z.string().max(255).optional(),
  sucursal: z.number({ required_error: "La sucursal es requerida" }),
  participantes: z.array(z.number()).min(1, "Agrega al menos un participante"),
});

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>;
