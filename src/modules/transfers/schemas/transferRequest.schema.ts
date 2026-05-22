import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// ITEM SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const CreateTransferRequestItemSchema = z.object({
  producto_id: z.number().int().positive(),
  cantidad_solicitada: z.number().positive(),
});

export const TransferRequestItemSchema = z.object({
  id: z.number().int().positive(),
  producto_id: z.number().int().positive(),
  producto_descripcion: z.string(),
  cantidad_solicitada: z.number().positive(),
  cantidad_cumplida: z.number().nullable(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PAYLOAD SCHEMA (for form validation)
// ─────────────────────────────────────────────────────────────────────────────

export const CreateTransferRequestPayloadSchema = z.object({
  sucursal_solicitante_id: z.number().int().positive(),
  sucursal_destinataria_id: z.number().int().positive(),
  usuario_destinatario_id: z.number().int().positive(),
  items: z.array(CreateTransferRequestItemSchema).min(1, {
    message: "Debe incluir al menos un producto en la solicitud",
  }),
  notas: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// GET RESPONSE SCHEMA (for API response parsing)
// ─────────────────────────────────────────────────────────────────────────────

const TransferRequestEstadoSchema = z.enum([
  "pending",
  "fulfilled",
  "imported",
  "in_progress",
  "partial",
  "cancelled",
]);

export const TransferRequestGetSchema = z.object({
  id: z.number().int().positive(),
  sucursal_solicitante_id: z.number(),
  sucursal_solicitante_nombre: z.string(),
  sucursal_destinataria_id: z.number(),
  sucursal_destinataria_nombre: z.string(),
  usuario_solicitante_id: z.number(),
  usuario_solicitante_nombre: z.string(),
  usuario_destinatario_id: z.number(),
  usuario_destinatario_nombre: z.string(),
  estado: TransferRequestEstadoSchema,
  notas: z.string().nullable(),
  chat_message_id: z.number().nullable(),
  product_transfer_id: z.number().nullable().optional(),
  items: z.array(TransferRequestItemSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED TYPES (from schemas)
// ─────────────────────────────────────────────────────────────────────────────

export type CreateTransferRequestPayloadInput = z.input<
  typeof CreateTransferRequestPayloadSchema
>;
