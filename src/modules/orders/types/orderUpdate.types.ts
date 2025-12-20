import type z from "zod";
import type { OrderDetailUpdateSchema, OrderUpdateSchema } from "../schemas/orderUpdateSchema";

export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;
export type OrderDetailUpdate = z.infer<typeof OrderDetailUpdateSchema>;
export interface UIOrderDetailUpdate extends OrderDetailUpdate {
    product: {
        id: number
        descripcion: string
        codigo_oem: string | null,
        codigo_upc: string | null,
        precio_venta: number,
        marca: string | null,
        procedencia: string | null
    };
}