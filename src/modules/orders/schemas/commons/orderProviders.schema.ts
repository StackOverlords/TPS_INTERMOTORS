import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const OrderProviderGetSchema = z.object({
    id: z.number(),
    nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
    nit: z.string().nullable(),
});

export const OrderProvidersGetAllSchema = paginatedResponseSchema(OrderProviderGetSchema)