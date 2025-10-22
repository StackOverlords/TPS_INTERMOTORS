import z from "zod";

export const ReturnResponsibleGetSchema = z.object({
    id: z.number(),
    nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
});

export const ReturnResponsiblesGetAllSchema = z.object({
    data: z.array(ReturnResponsibleGetSchema),
});