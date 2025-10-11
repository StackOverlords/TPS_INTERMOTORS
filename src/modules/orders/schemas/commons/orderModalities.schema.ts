import z from "zod";

const IdSchema = z.string()
const LabelSchema = z.string();

export const OrderModalitiesResponseSchema = z.record(IdSchema, LabelSchema);

export const OrderModalitiesSchema = z.object({
    id: z.string(),
    label: z.string(),
});
export const OrderModalitiesListSchema = z.array(OrderModalitiesSchema);