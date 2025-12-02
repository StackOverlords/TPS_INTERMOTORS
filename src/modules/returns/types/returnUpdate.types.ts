import type z from "zod";
import type { ReturnDetailUpdateSchema, ReturnUpdateSchema } from "../schemas/returnUpdateSchema";

export type ReturnUpdate = z.infer<typeof ReturnUpdateSchema>;
export type ReturnDetailUpdate = z.infer<typeof ReturnDetailUpdateSchema>;
export interface UIReturnDetailUpdate extends ReturnDetailUpdate {
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