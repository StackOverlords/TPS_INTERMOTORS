import { strictMoneySchema } from "@/modules/shared/schemas/numberSchemas";
import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import { z } from "zod";

const ResponsableSchema = z.object({
    apellido_materno: z.string().nullable(),
    apellido_paterno: z.string().nullable(),
    celular: z.string().nullable(),
    dni: z.number().nullable(),
    id: z.number(),
    nombre: z.string(),
});

export const ReturnGetSchema = z.object({
    id: z.number(),
    nro: z.number(),
    fecha: z.string(),
    fecha_reg: z.string().nullable(),
    comprobante: z.string().nullable(),
    responsable: ResponsableSchema.nullable(),
    total: strictMoneySchema,
    comentarios: z.string().nullable(),
    motivo: z.string()
});

export const ReturnsGetAllSchema = paginatedResponseSchema(ReturnGetSchema);