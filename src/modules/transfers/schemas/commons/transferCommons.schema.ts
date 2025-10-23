import { z } from "zod";

// Schema para responsables
export const TransferResponsibleGetSchema = z.object({
    id: z.number(),
    nombre: z.string(),
});

export const TransferResponsiblesGetAllSchema = z.object({
    data: z.array(TransferResponsibleGetSchema),
});

// Schema para sucursales
const InformacionContactoSchema = z.object({
    direccion: z.string().nullable(),
    telefono: z.string().nullable(),
    celular: z.string().nullable(),
    fax: z.string().nullable(),
});

export const TransferBranchGetSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    sigla: z.string(),
    nombre_comercial: z.string().nullable(),
    activo: z.string(),
    informacion_contacto: InformacionContactoSchema,
});

export const TransferBranchesGetAllSchema = z.object({
    data: z.array(TransferBranchGetSchema),
});
