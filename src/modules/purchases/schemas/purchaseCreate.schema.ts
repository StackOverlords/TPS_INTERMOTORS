import { z } from "zod";

/**
 * Schema para un detalle de compra (crear)
 */
export const PurchaseDetailCreateSchema = z.object({
  id_producto: z.number().int().positive("El producto es requerido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  costo: z.number().nonnegative("El costo no puede ser negativo"),
  inc_p_venta: z.number().nonnegative("El incremento no puede ser negativo"),
  precio_venta: z.number().nonnegative("El precio de venta no puede ser negativo"),
  inc_p_venta_alt: z.number().nonnegative("El incremento alternativo no puede ser negativo"),
  precio_venta_alt: z.number().nonnegative("El precio de venta alternativo no puede ser negativo"),
  tc_compra: z.number().positive("El tipo de cambio debe ser mayor a 0"),
});

/**
 * Schema para crear una compra
 */
export const PurchaseCreateSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  nro_comprobante: z.string().optional(),
  nro_comprobante2: z.string().optional(),
  id_proveedor: z.number().int().positive("El proveedor es requerido"),
  tipo_compra: z.string().min(1, "El tipo de compra es requerido"),
  forma_compra: z.string().min(1, "La forma de compra es requerida"),
  comentario: z.string().optional(),
  sucursal: z.number().int().positive("La sucursal es requerida"),
  id_responsable: z.number().int().positive("El responsable es requerido"),
  id_pedido: z.number().int().positive().optional().nullable(),
  detalles: z.array(PurchaseDetailCreateSchema).min(1, "Debe agregar al menos un producto"),
  generar_movimiento_caja: z.boolean().default(false),
  forma_pago_caja: z.string().nullable().optional(),
});

/**
 * Tipos TypeScript derivados de los schemas
 */
export type PurchaseDetailCreate = z.infer<typeof PurchaseDetailCreateSchema>;
export type PurchaseCreate = z.infer<typeof PurchaseCreateSchema>;