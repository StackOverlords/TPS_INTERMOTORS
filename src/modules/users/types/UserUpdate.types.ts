import type { UserUpdateSchema } from "../schemas/userUpdate.schema";
import type { z } from "zod";

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// Tipo para la respuesta del servidor al actualizar usuario
export interface UserUpdateResponse {
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
