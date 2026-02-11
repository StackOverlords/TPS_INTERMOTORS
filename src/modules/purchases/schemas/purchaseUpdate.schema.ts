import { z } from "zod";

/**
 * Schema para un detalle de compra existente (actualizar)
 */
export const PurchaseDetailUpdateSchema = z.object({
  id_detalle_compra: z.number().int().positive().optional().nullable(),
  id_producto: z.number().int().positive("El producto es requerido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  costo: z.number().nonnegative("El costo no puede ser negativo"),
  inc_p_venta: z.number().nonnegative("El incremento no puede ser negativo"),
  precio_venta: z
    .number()
    .nonnegative("El precio de venta no puede ser negativo"),
  inc_p_venta_alt: z
    .number()
    .nonnegative("El incremento alternativo no puede ser negativo"),
  precio_venta_alt: z
    .number()
    .nonnegative("El precio de venta alternativo no puede ser negativo"),
  tc_compra: z.number().positive("El tipo de cambio debe ser mayor a 0"),
});

/**
 * Schema para actualizar una compra
 */
export const PurchaseUpdateSchema = z.object({
    fecha: z.string().min(1, "La fecha es requerida"),
    nro_comprobante: z.string().optional(),
    nro_comprobante2: z.string().optional(),
  id_proveedor: z.number().int().positive("El proveedor es requerido"),
  tipo_compra: z.string().min(1, "El tipo de compra es requerido"),
  forma_compra: z.string().min(1, "La forma de compra es requerida"),
  comentario: z.string().optional(),
  id_responsable: z.number().int().positive("El responsable es requerido"),
  detalles: z
    .array(PurchaseDetailUpdateSchema)
    .min(1, "Debe agregar al menos un producto"),
});

/**
 * Schema para el formulario de actualización (incluye datos del UI)
 */
export const PurchaseUpdateFormSchema = PurchaseUpdateSchema.extend({
  detalles: z.array(
    PurchaseDetailUpdateSchema.extend({
      producto: z.object({
        id: z.number(),
        descripcion: z.string(),
        codigo_oem: z.string().nullable().optional(),
        codigo_upc: z.string().nullable().optional(),
        precio_venta: z.number(),
        stock_actual: z.number(),
        marca: z.string().optional(),
        categoria: z.string().nullable().optional(),
      }),
    }),
  ),
});

/**
 * Tipos TypeScript derivados de los schemas
 */
export type PurchaseDetailUpdate = z.infer<typeof PurchaseDetailUpdateSchema>;
export type PurchaseUpdate = z.infer<typeof PurchaseUpdateSchema>;
export type PurchaseUpdateForm = z.infer<typeof PurchaseUpdateFormSchema>;

/**
 * Tipo para el detalle de compra en el UI (edición)
 */
export type PurchaseUpdateDetailUI = PurchaseDetailUpdate & {
  producto: {
    id: number;
    descripcion: string;
    codigo_oem: string | null;
    codigo_upc: string | null;
    precio_venta: number;
    stock_actual: number;
    marca?: string;
    categoria: string | null;
  };
};
