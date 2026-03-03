import z from "zod";

export const ProductUpdateSchema = z.object({
  id_categoria: z
    .number()
    .min(1, "El campo Categoría es requerido")
    .nonnegative(),
  id_subcategoria: z.number().nullable().optional(),
  descripcion: z.string().nonempty(),
  descripcion_alt: z.string(),
  codigo_oem: z.string().nullable(),
  codigo_upc: z.string().nonempty(),
  modelo: z.string().nullable(),
  medida: z.string().nullable(),
  nro_motor: z.string().nullable(),
  costo_referencia: z
    .number()
    .nonnegative()
    .min(1, "El Costo Referencia debe ser mayor a 0"),
  stock_minimo: z
    .number()
    .nonnegative()
    .min(1, "El campo Stock Mínimo debe ser al menos 1"),
  precio_venta: z
    .number()
    .nonnegative()
    .min(1, "El Precio de Venta debe ser mayor a 0"),
  precio_venta_alt: z
    .number()
    .nonnegative()
    .min(1, "El Precio de Venta Alternativo debe ser mayor a 0"),
  id_marca: z.number().min(1, "El campo Marca es requerido").nonnegative(),
  id_procedencia: z
    .number()
    .min(1, "El campo Procedencia es requerido")
    .nonnegative(),
  id_marca_vehiculo: z
    .number()
    .min(1, "El campo Marca Vehículo es requerido")
    .nonnegative(),
  id_unidad: z
    .number()
    .min(1, "El campo Unidad de Medida es requerido")
    .nonnegative(),
});
