import { z } from "zod";

/**
 * Schema para una nota de crédito individual (respuesta de API)
 */
export const CreditNoteSchema = z.object({
  id: z.number(),
  sucursal: z.number(),
  monto: z.coerce.number(),
  fecha: z.string(),
  comentarios: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

/**
 * Schema para la respuesta de lista de notas de crédito
 */
export const CreditNoteListResponseSchema = z.object({
  data: z.array(CreditNoteSchema),
});

/**
 * Schema para crear una nota de crédito contra una compra
 *
 * POST /api/v1/accounts-payable/actions/credit-notes/{id_compra}
 */
export const CreateCreditNoteSchema = z.object({
  proveedor_id: z.number().int(),
  unidad_organizativa_id: z.number().int(),
  monto: z
    .number()
    .positive("El monto debe ser mayor a 0")
    .transform((val) => parseFloat(val.toFixed(2))),
  fecha: z.string().min(1, "La fecha es requerida"),
  comentarios: z.string().nullable().optional(),
});

export type CreditNote = z.infer<typeof CreditNoteSchema>;
export type CreditNoteListResponse = z.infer<typeof CreditNoteListResponseSchema>;
export type CreateCreditNoteData = z.infer<typeof CreateCreditNoteSchema>;
