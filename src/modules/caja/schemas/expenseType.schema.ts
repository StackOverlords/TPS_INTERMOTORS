import z from "zod";

export const ExpenseTypeSchema = z.object({
    id: z.number().int(),
    nombre: z.string(),
    descripcion: z.string().nullable(),
    activo: z.boolean(),
    fecha_reg: z.string(),
});

export const ExpenseTypeListSchema = z.array(ExpenseTypeSchema);

export type ExpenseTypeSchemaType = z.infer<typeof ExpenseTypeSchema>;
export type ExpenseTypeList = z.infer<typeof ExpenseTypeListSchema>;
