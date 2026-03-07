import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const EmployeeSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string().nullable(),
  apellido_m: z.string().nullable(),
  direccion: z.string().nullable(),
  activo: z.boolean(),
  responsable_ventas: z.boolean().nullable(),
  responsable_compras: z.boolean().nullable(),
});

export const GetAllEmployeesSchema = paginatedResponseSchema(EmployeeSchema);

export const CreateEmployeeSchema = z.object({
  fecha_ingreso: z.string().nonempty(),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido_p: z.string().min(1, "El apellido paterno es requerido"),
  apellido_m: z.string().optional(),
  sexo: z.string().min(1, "El sexo es requerido"),
  dni: z.number().int().positive("El DNI debe ser un número entero positivo"),
  dni_comp: z.string().optional(),
  dni_tipo: z.string().min(1, "El tipo de DNI es requerido"),
  telefono: z.string().optional(),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  email: z.string().email("Formato de correo electrónico inválido"),
  responsable_ventas: z.boolean(),
  responsable_compras: z.boolean(),
});

export const UpdateEmployeeSchema = z.object({
  fecha_ingreso: z.string().nonempty(),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido_p: z.string().min(1, "El apellido paterno es requerido"),
  apellido_m: z.string().optional(),
  sexo: z.string().min(1, "El sexo es requerido"),
  dni: z.number().int().positive("El DNI debe ser un número entero positivo"),
  dni_comp: z.string().optional(),
  dni_tipo: z.string().min(1, "El tipo de DNI es requerido"),
  telefono: z.string().optional(),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  email: z.string().email("Formato de correo electrónico inválido"),
  responsable_ventas: z.boolean(),
  responsable_compras: z.boolean(),
});

export const GetByIdEmployeeSchema = z.object({
  id: z.number(),
  fecha_ingreso: z.string().nonempty(),
  activo: z.boolean(),
  responsable_ventas: z.boolean().nullable(),
  responsable_compras: z.boolean().nullable(),
  persona: z.object({
    id: z.number(),
    nombre: z.string(),
    apellido_paterno: z.string().nullable(),
    apellido_materno: z.string().nullable(),
    dni: z.number().int().nullable(),
    dni_comp: z.string().nullable(),
    dni_tipo: z.string().nullable(),
    celular: z.string().nullable(),
    telefono: z.string().nullable(),
    direccion: z.string().nullable(),
    sexo: z.string().nullable(),
    correo: z
      .string()
      .email("Formato de correo electrónico inválido")
      .nullable(),
  }),
});

export const EmployeeFiltersSchema = z.object({
  pagina: z
    .number()
    .int()
    .positive("La página debe ser un número entero positivo"),
  pagina_registros: z
    .number()
    .int()
    .positive(
      "La cantidad de registros por página debe ser un número entero positivo",
    ),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  activo: z.number().int().optional(),
});
