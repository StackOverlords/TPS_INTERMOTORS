import z from "zod";

const IdSchema = z.string()
const LabelSchema = z.string();

export const ReturnTypesResponseSchema = z.record(IdSchema, LabelSchema);

export const ReturnTypesSchema = z.object({
    id: z.string(),
    label: z.string(),
});
export const ReturnTypesListSchema = z.array(ReturnTypesSchema);