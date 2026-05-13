import { z } from "zod";

export const messagingUserSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  nickname: z.string(),
  online: z.boolean(),
  last_seen_at: z.string().nullable(),
});

export const messagingUserGroupSchema = z.object({
  sucursal: z.object({
    id: z.number(),
    nombre: z.string(),
    sigla: z.string(),
  }),
  usuarios: z.array(messagingUserSchema),
});

export const messagingUsersResponseSchema = z.array(messagingUserGroupSchema);
