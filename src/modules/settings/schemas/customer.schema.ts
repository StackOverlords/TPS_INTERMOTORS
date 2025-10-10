import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const CustomerSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    nit: z.union([z.string(), z.number()]).nullable(),
    contacto: z.string().nullable(),
    direccion: z.string().nullable(),
    codigo_interno: z.number(),
    dias_plazo: z.number(),
    default_transferencias: z.string().nullable(),
    pais: z.string(),
    activo: z.boolean(),
});

export const GetAllCustomersSchema = paginatedResponseSchema(CustomerSchema);

export const CreateCustomerSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    direccion: z.string().optional(),
    nit: z.string().optional(),
    telefono: z.string().optional(),
    celular: z.string().optional(),
    contacto: z.string().optional(),
    dias_plazo: z.number(),
    pais_id: z.number(),
    provincia_departamento_id: z.number(),
    ciudad_id: z.number(),
});

export const UpdateCustomerSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido").optional(),
    direccion: z.string().optional(),
    nit: z.string().optional(),
    telefono: z.string().optional(),
    celular: z.string().optional(),
    contacto: z.string().optional(),
    dias_plazo: z.number().optional(),
    activo: z.boolean().optional(),
    pais_id: z.number(),
    provincia_departamento_id: z.number(),
    ciudad_id: z.number(),
});

export const GetByIdCustomerSchema = z.object({
    id: z.number(),
    cliente: z.string(),
    direccion: z.string().nullable(),
    nit: z.union([z.string(), z.number()]).nullable(),
    contacto: z.string().nullable(),
    telefono: z.string().nullable(),
    celular: z.string().nullable(),
    dias_plazo: z.number(),
    activo: z.boolean(),
    transferencias: z.boolean().nullable(),
    codigo_interno: z.number(),
    pais: z.string(),
    pais_id: z.number(),
    departamento: z.string().nullable(),
    departamento_id: z.number().nullable(),
    ciudad: z.string().nullable(),
    ciudad_id: z.number().nullable(),
});
