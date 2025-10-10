import type z from "zod";
import type { OrderDetailUpdateSchema, OrderUpdateSchema } from "../schemas/orderUpdateSchema";

export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;
export type OrderDetailUpdate = z.infer<typeof OrderDetailUpdateSchema>;