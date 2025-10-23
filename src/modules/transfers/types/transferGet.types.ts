import type z from "zod";
import type {
    TransfersGetAllSchema,
    TransferGetAllSchema,
    TransferGetByIdSchema,
    TransferDetailGetByIdSchema
} from "../schemas/transferGetSchema";

export type TransfersGetAllResponse = z.infer<typeof TransfersGetAllSchema>;
export type TransferGetAll = z.infer<typeof TransferGetAllSchema>;
export type TransferGetById = z.infer<typeof TransferGetByIdSchema>;
export type TransferDetailGetById = z.infer<typeof TransferDetailGetByIdSchema>;
