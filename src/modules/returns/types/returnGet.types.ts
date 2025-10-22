import type z from "zod";
import type { ReturnGetSchema, ReturnsGetAllSchema } from "../schemas/returnGetSchema";
import type { ReturnByIdSchema, ReturnDetailGetByIdSchema } from "../schemas/returnGetByIdSchema";

export type ReturnsGetAllResponse = z.infer<typeof ReturnsGetAllSchema>
export type ReturnGetAll = z.infer<typeof ReturnGetSchema>

// tipos para devoluciones por id
export type ReturnGetById = z.infer<typeof ReturnByIdSchema>
export type ReturnDetailGetById = z.infer<typeof ReturnDetailGetByIdSchema>