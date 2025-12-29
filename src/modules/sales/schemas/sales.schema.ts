import { z } from "zod";

export const SaleDetailSchema = z.object({
  id_producto: z.number(),
  cantidad: z.number().positive(),
  precio: z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))),
  descuento: z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))),
  porcentaje_descuento: z.number().nonnegative().transform((val) => parseFloat(val.toFixed(5))),
  orden: z.number().int().nonnegative(),
});

export const SaleSchema = z.object({
  fecha: z.string().nonempty(),
  nro_comprobante: z.string().nullable(),
  nro_comprobante2: z.string().nullable(),
  id_cliente: z.number(),
  tipo_venta: z.string().nonempty(),
  forma_venta: z.string().nonempty(),
  comentario: z.string().nullable(),
  plazo_pago: z.string().nullable(),
  vehiculo: z.string().nullable(),
  nro_motor: z.string().nullable(),
  cliente_nombre: z.string().nullable(),
  cliente_nit: z.string().nullable(),
  sucursal: z.number(),
  id_responsable: z.number(),
  detalles: z.array(SaleDetailSchema).nonempty('La venta debe tener al menos un detalle de producto'),
});
export const SaleDetailListSchema = z.array(SaleDetailSchema).nonempty()