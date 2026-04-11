import { z } from "zod";

// Schema para el cliente
const ClienteSchema = z.object({
    id: z.number(),
    cliente: z.string(),
    direccion: z.string().nullable(),
    nit: z.number().nullable(),
    contacto: z.string().nullable(),
});

// Schema para el responsable
const ResponsableSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    apellido_paterno: z.string().nullable(),
    apellido_materno: z.string().nullable(),
    dni: z.number().nullable(),
    dni_comp: z.string().nullable(),
    dni_tipo: z.string().nullable(),
    celular: z.string().nullable(),
    telefono: z.string().nullable(),
    direccion: z.string().nullable(),
    sexo: z.string().nullable(),
}).nullable();

// Schema para una cuenta por cobrar individual
export const AccountReceivableSchema = z.object({
    id: z.number(),
    nro_venta: z.string(),
    fecha: z.string(), // formato: yyyy-mm-dd HH:mm:ss.SSS
    comprobantes: z.string(),
    contexto: z.string(),
    cliente: ClienteSchema,
    responsable: ResponsableSchema,
    total_vendido: z.number(),
    total_pagado: z.number(),
    comentarios: z.string().nullable(),
    saldo: z.number(),
    plazo_pago: z.string().nullable(), // formato: yyyy-mm-dd
});
