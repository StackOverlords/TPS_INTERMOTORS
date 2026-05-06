import type z from "zod";
import type { TransferCreateSchema, TransferDetailCreateSchema } from "../schemas/transferCreateSchema";
import type { ProductStock } from "@/modules/products/types/productStock";

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
    /** All lots for this product (oldest-first). When present, getTransferDetails does FIFO split. */
    lots?: ProductStock[];
    /** Sum of all lot saldos — used for quantity validation. */
    total_saldo?: number;
    id_detalle_transferencia?: number;
}
