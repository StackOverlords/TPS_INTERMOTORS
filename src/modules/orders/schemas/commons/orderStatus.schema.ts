import z from "zod";

const IdSchema = z.string()
const LabelSchema = z.string();

export const OrderStatusResponseSchema = z.record(IdSchema, LabelSchema);

export const OrderStatusSchema = z.object({
    id: z.string(),
    label: z.string(),
});
export const OrderStatusListSchema = z.array(OrderStatusSchema);