import { z } from "zod"

export const ProveedorSchema = z.object({
    id: z.number(),
    proveedor: z.string(),
    direccion: z.string().nullable(),
    nit: z.string().nullable(),
    contacto: z.string().nullable(),
})

export const ResponsableSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    apellido_paterno: z.string(),
    apellido_materno: z.string().nullable(),
    dni: z.number().nullable(),
    celular: z.string().nullable(),
})

export const PurchaseGetSchema = z.object({
    id: z.number(),
    nro_compra: z.string(),
    fecha: z.string(),
    comprobantes: z.string(),
    contexto: z.string(),
    proveedor: ProveedorSchema,
    responsable: ResponsableSchema.nullable(),
    total: z.number(),
    comentarios: z.string().nullable(),
})

export type PurchaseGet = z.infer<typeof PurchaseGetSchema>
export type Proveedor = z.infer<typeof ProveedorSchema>
export type Responsable = z.infer<typeof ResponsableSchema>
