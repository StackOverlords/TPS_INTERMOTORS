import type { UserCreateSchema } from "../schemas/userCreate.schema";
import type { z } from "zod";

export type UserCreate = z.infer<typeof UserCreateSchema>;

// Tipo para la respuesta del servidor al crear usuario
export interface UserCreateResponse {
  id: number;
  nickname: string;
  email: string;
  empleado: {
    id: number;
    nombre: string;
  };
  activo: boolean;
  fecha_creacion: string;
}
