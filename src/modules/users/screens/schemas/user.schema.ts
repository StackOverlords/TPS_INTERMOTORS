import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  nickname: z.string(),
  email: z.string().nullable(),
  fecha_creacion: z.string().nullable(),
  activo: z.boolean(),
  empleado: z.object({
    id: z.number(),
    nombre: z.string(),
  }),
});
export const PermissionsResponse = z.array(z.object({
  name: z.string().nullable(),
  categoria: z.string().nullable(),
  descripcion: z.string().nullable(),
}).nullable());

export const UserListResponseSchema = z.object({
  data: z.array(UserSchema),
  links: z.object({
    first: z.string(),
    last: z.string(),
    prev: z.string().nullable(),
    next: z.string().nullable(),
  }),
  meta: z.object({
    current_page: z.number(),
    from: z.number(),
    last_page: z.number(),
    links: z.array(
      z.object({
        url: z.string().nullable(),
        label: z.string(),
        page: z.number().nullable(),
        active: z.boolean(),
      })
    ),
    path: z.string(),
    per_page: z.number(),
    to: z.number(),
    total: z.number(),
  }),
});

export const PermissionSchema = z.object({
  name: z.string(),
});
 
const permissionSchemaGroup = {
  name: z.string({
    required_error: "El nombre del permiso es requerido.",
    invalid_type_error: "El nombre debe ser un texto.",
  }),
  categoria: z.string().nullable(),
  descripcion: z.string().nullable(),
};
export const PermissionGroupSchema = z.record(z.array(z.object(permissionSchemaGroup)));

export const UserPermissionsRequestSchema = z.object({
  usuario: z.number(),
  permisos: z.array(PermissionSchema),
});
