import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const ContactInfoSchema = z.object({
    direccion: z.string().nullable(),
    telefono: z.string().nullable(),
    celular: z.string().nullable(),
    fax: z.string().nullable(),
});

export const BranchSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    sigla: z.string(),
    nombre_comercial: z.string().nullable(),
    activo: z.enum(["SI", "NO"]),
    informacion_contacto: ContactInfoSchema,
});

export const GetAllBranchesSchema = paginatedResponseSchema(BranchSchema);

export const CreateBranchSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    sigla: z.string().min(1, "La sigla es requerida"),
    nombre_comercial: z.string().min(1, "El nombre comercial es requerido"),
    direccion: z.string().min(1, "La dirección es requerida"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    celular: z.string().optional(),
    fax: z.string().optional(),
    imagen: z.instanceof(File).optional(),
});

export const UpdateBranchSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    sigla: z.string().min(1, "La sigla es requerida"),
    nombre_comercial: z.string().min(1, "El nombre comercial es requerido"),
    direccion: z.string().min(1, "La dirección es requerida"),
    telefono: z.string().min(1, "El teléfono es requerido"),
    celular: z.string().optional(),
    fax: z.string().optional(),
    imagen: z.instanceof(File).optional(),
});

// Schema para la respuesta de creación (formato diferente de la API)
export const CreateBranchResponseSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    sigla: z.string(),
    nombre_comercial: z.string().nullable(),
    activo: z.boolean(),
    direccion: z.string().nullable(),
    telefono: z.string().nullable(),
    celular: z.string().nullable(),
    fax: z.string().nullable(),
    imagen: z.string().nullable(),
    imagen_name: z.string().nullable(),
    imagen_ext: z.string().nullable(),
});

// El endpoint getById devuelve el mismo formato que create/update
export const GetByIdBranchSchema = CreateBranchResponseSchema;

// Schemas para la gestión de usuarios en sucursales
export const BranchUserSchema = z.object({
    id_usuario: z.number().nullable(),
    usuario: z.object({
        nickname: z.string().nullable(),
        fecha_creacion: z.string().nullable(),
        email: z.string().nullable().nullable(),
        data_empleado: z.object({
            id: z.number().nullable(),
            nombre: z.string().nullable(),
        }).nullable(),
    }).nullable(),
    rol: z.string().nullable(),
    rol_name: z.string().nullable(),
    fecha_registro: z.string().nullable(),
});

export const GetBranchUsersSchema = z.object({
    data: z.array(BranchUserSchema),
});

export const BranchRolesSchema = z.record(z.string(), z.string());

export const AddUserToBranchSchema = z.object({
    usuario_id: z.number(),
    rol: z.string(),
});
