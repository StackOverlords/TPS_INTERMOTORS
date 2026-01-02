import { z } from "zod";
import { DNI_TIPO_VALUES, SEXO_VALUES } from "./userCreate.schema";

// Schema para edición - sin campos de contraseña
export const UserUpdateSchema = z.object({
  nombre: z.string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),

  apellido_p: z.string()
    .min(1, "El apellido paterno es requerido")
    .max(100, "El apellido paterno no puede exceder 100 caracteres"),

  apellido_m: z.string()
    .max(100, "El apellido materno no puede exceder 100 caracteres")
    .nullable()
    .optional(),

  sexo: z.enum(SEXO_VALUES, {
    errorMap: () => ({ message: "Selecciona un sexo válido (M o F)" })
  }),

  dni: z.number()
    .int("El DNI debe ser un número entero")
    .positive("El DNI debe ser un número positivo")
    .refine((val) => val.toString().length >= 5 && val.toString().length <= 11, {
      message: "El DNI debe tener entre 5 y 11 dígitos"
    }),

  dni_comp: z.string()
    .max(50, "El complemento de DNI no puede exceder 50 caracteres")
    .nullable()
    .optional(),

  dni_tipo: z.enum(DNI_TIPO_VALUES, {
    errorMap: () => ({ message: "Selecciona un tipo de DNI válido" })
  }),

  telefono: z.string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .nullable()
    .optional(),

  celular: z.string()
    .max(20, "El celular no puede exceder 20 caracteres")
    .nullable()
    .optional(),

  direccion: z.string()
    .max(255, "La dirección no puede exceder 255 caracteres")
    .nullable()
    .optional(),

  fecha_ingreso: z.string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(val);
    }, {
      message: "La fecha debe estar en formato YYYY-MM-DD"
    }),

  email: z.string()
    .email("Ingresa un email válido")
    .min(1, "El email es requerido")
    .max(255, "El email no puede exceder 255 caracteres"),

  nombre_usuario: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(50, "El nombre de usuario no puede exceder 50 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos"),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;
