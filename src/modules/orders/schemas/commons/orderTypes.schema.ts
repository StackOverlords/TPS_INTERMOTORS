import z from "zod";

const IdSchema = z.string()
const LabelSchema = z.string();

export const OrderTypesResponseSchema = z.record(IdSchema, LabelSchema);

export const OrderTypesSchema = z.object({
    id: z.string(),
    label: z.string(),
});
export const OrderTypesListSchema = z.array(OrderTypesSchema);