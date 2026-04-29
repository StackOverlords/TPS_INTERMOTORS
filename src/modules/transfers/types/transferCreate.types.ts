import type z from "zod";
import type { TransferCreateSchema, TransferDetailCreateSchema } from "../schemas/transferCreateSchema";

export type TransferCreate = z.infer<typeof TransferCreateSchema>;
export type TransferDetailCreate = z.infer<typeof TransferDetailCreateSchema>;

export interface UITransferDetailCreate extends TransferDetailCreate {
    product: {
        id: number;
        descripcion: string;
        codigo_oem: string | null;
        codigo_upc: string | null;
        marca: string | null;
        costo: number;
        precio_venta: number;
        precio_venta_alt: number;
    };
    purchase_id: number;
    lot_fecha?: string;
    lot_saldo?: number;
    id_detalle_transferencia?: number;
}
