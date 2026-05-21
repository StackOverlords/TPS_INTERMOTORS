import type { ProductGet } from "@/modules/products/types/ProductGet";
import type { ProductStock } from "@/modules/products/types/productStock";

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO (State Machine)
// ─────────────────────────────────────────────────────────────────────────────

export type TransferRequestEstado =
  | "pending"
  | "fulfilled"
  | "imported"
  | "in_progress"
  | "partial"
  | "cancelled";

// ─────────────────────────────────────────────────────────────────────────────
// ITEM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TransferRequestItem {
  id: number;
  producto_id: number;
  producto_descripcion: string;
  cantidad_solicitada: number;
  cantidad_cumplida: number | null;
}

export interface CreateTransferRequestItem {
  producto_id: number;
  cantidad_solicitada: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE (POST /transfer-requests)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateTransferRequestPayload {
  sucursal_solicitante_id: number;
  sucursal_destinataria_id: number;
  usuario_destinatario_id: number;
  items: CreateTransferRequestItem[];
  notas?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET (GET /transfer-requests/{id})
// ─────────────────────────────────────────────────────────────────────────────

export interface TransferRequest {
  id: number;
  sucursal_solicitante_id: number;
  sucursal_solicitante_nombre: string;
  sucursal_destinataria_id: number;
  sucursal_destinataria_nombre: string;
  usuario_solicitante_id: number;
  usuario_solicitante_nombre: string;
  usuario_destinatario_id: number;
  usuario_destinatario_nombre: string;
  estado: TransferRequestEstado;
  notas: string | null;
  chat_message_id: number | null;
  product_transfer_id: number | null;
  items: TransferRequestItem[];
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULFILL DIRECT (POST /transfer-requests/{id}/fulfill-direct)
// ─────────────────────────────────────────────────────────────────────────────

export interface FulfilledItem {
  producto_id: number;
  producto_descripcion: string;
  cantidad: number;
  lots_used: {
    almacen_id: number;
    lote: string;
    fecha_ingreso: string;
    cantidad: number;
    costo: number;
  }[];
}

export interface SkippedItem {
  producto_id: number;
  producto_descripcion: string;
  cantidad_solicitada: number;
  cantidad_disponible: number;
  reason: "INSUFFICIENT_STOCK" | "NO_STOCK" | "PRODUCT_INACTIVE";
}

export interface FulfillDirectResult {
  transfer_id: number | null;
  request_estado: TransferRequestEstado;
  fulfilled_items: FulfilledItem[];
  skipped_items: SkippedItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT (POST /transfer-requests/{id}/import)
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportResultItem {
  producto_id: number;
  product: ProductGet;
  lots: ProductStock[];
  cantidad_solicitada: number;
}

export interface ImportResult {
  request_id: number;
  sucursal_solicitante_id: number;
  sucursal_destinataria_id: number;
  items: ImportResultItem[];
}
