import type z from "zod";
import type { OrderCreateSchema, OrderDetailCreateSchema } from "../schemas/orderCreateSchema";

export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type OrderDetailCreate = z.infer<typeof OrderDetailCreateSchema>;
export interface UIOrderDetailCreate extends OrderDetailCreate {
    product: {
        id: number
        codigo_interno: number,
        descripcion: string
        codigo_oem: string | null,
        codigo_upc: string | null,
        precio_venta: number,
        marca: string | null,
        procedencia: string | null
    };
}