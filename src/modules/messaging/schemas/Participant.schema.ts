import { z } from 'zod';

export const participantSchema = z.object({
  id: z.number(),
  usuario_id: z.number(),
  nombre: z.string(),
  email: z.string(),
  rol: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  activo: z.boolean(),
  silenciado: z.boolean(),
  ultima_lectura: z.string(),
  fecha_ingreso: z.string(),
});

export const participantsResponseSchema = z.object({
  data: z.array(participantSchema),
});

export const addParticipantSchema = z.object({
  usuario_id: z.number({ required_error: 'El usuario es requerido' }),
});