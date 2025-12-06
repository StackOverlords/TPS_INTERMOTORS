import type z from "zod";
import type { ReturnCreateSchema, ReturnDetailCreateSchema } from "../schemas/returnCreateSchema";

export type ReturnCreate = z.infer<typeof ReturnCreateSchema>;
export type ReturnDetailCreate = z.infer<typeof ReturnDetailCreateSchema>;
export interface UIReturnDetailCreate extends ReturnDetailCreate {
    product: {
        id: number
        descripcion: string
        codigo_oem: string | null,
        codigo_upc: string | null,
        precio_venta: number,
    };
    sale_id: number
    maxQuantity: number;
}