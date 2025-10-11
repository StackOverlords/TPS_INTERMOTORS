import z from "zod";

export const OrderResponsibleGetSchema = z.object({
    id: z.number(),
    nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
});

export const OrderResponsiblesGetAllSchema = z.object({
    data: z.array(OrderResponsibleGetSchema),
});