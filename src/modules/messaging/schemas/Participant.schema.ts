import { z } from 'zod';

export const participantSchema = z.object({
  id: z.number(),
  chat_id: z.number(),
  rol: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  rol_label: z.string(),
  activo: z.boolean(),
  puede_escribir: z.boolean(),
  silenciado: z.boolean(),
  ultima_lectura: z.string(),
  fecha_ingreso: z.string(),
  usuario: z.object({
    id: z.number(),
    nombre: z.string(),
  }),
});

export const participantsResponseSchema = z.object({
  data: z.array(participantSchema),
});

export const addParticipantSchema = z.object({
  usuario_id: z.number({ required_error: 'El usuario es requerido' }),
});