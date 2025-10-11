import type z from "zod";
import type { OrderGetSchema, OrdersGetAllSchema } from "../schemas/orderGetSchema";
import type { OrderByIdSchema, OrderDetailGetByIdSchema } from "../schemas/orderGetByIdSchema";

export type OrderGetAllResponse = z.infer<typeof OrdersGetAllSchema>
export type OrderGetAll = z.infer<typeof OrderGetSchema>

// tipos para pedidos por id
export type OrderGetById = z.infer<typeof OrderByIdSchema>
export type OrderDetailGetById = z.infer<typeof OrderDetailGetByIdSchema>