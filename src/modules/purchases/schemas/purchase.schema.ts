import { z } from "zod"

export const CategoriaSchema = z.object({
  id: z.number(),
  categoria: z.string(),
  id_estado: z.string(),
  codigo_interno: z.number(),
  version: z.number(),
})

export const SubcategoriaSchema = z.object({
  id: z.number(),
  subcategoria: z.string(),
  id_categoria: z.number(),
  id_estado: z.string(),
  codigo_interno: z.number(),
})

export const MarcaSchema = z.object({
  id: z.number(),
  marca: z.string(),
  id_estado: z.string(),
  codigo_interno: z.number(),
})

export const ProcedenciaSchema = z.object({
  id: z.number(),
  procedencia: z.string(),
  id_estado: z.string(),
  codigo_interno: z.number(),
})

export const UnidadMedidaSchema = z.object({
  id: z.number(),
  unidad_medida: z.string(),
  id_estado: z.string(),
  codigo_interno: z.number(),
})

export const MarcaVehiculoSchema = z.object({
  id: z.number(),
  marca_vehiculo: z.string(),
  codigo_interno: z.number(),
  id_estado: z.string(),
})

export const ProductoDetalleSchema = z.object({
  id: z.number(),
  codigo_interno: z.number(),
  descripcion: z.string(),
  descripcion_alt: z.string().nullable(),
  codigo_oem: z.string().nullable(),
  codigo_upc: z.string().nullable(),
  modelo: z.string().nullable(),
  medida: z.string().nullable(),
  nro_motor: z.string().nullable(),
  id_categoria: z.number(),
  categoria: CategoriaSchema.nullable(), // Puede ser objeto o null
  id_subcategora: z.number(),
  subcategoria: SubcategoriaSchema.nullable(),
  id_marca: z.number(),
  marca: MarcaSchema.nullable(),
  id_procedencia: z.number(),
  procedencia: ProcedenciaSchema.nullable(),
  id_unidad_medida: z.number(),
  unidad_medida: UnidadMedidaSchema.nullable(),
  costo_referencia: z.string(),
  stock_minimo: z.string().nullable(),
  precio_venta: z.string(),
  precio_venta_alt: z.string(),
  id_marca_vehiculo: z.number(),
  marca_vehiculo: MarcaVehiculoSchema.nullable(),
})

export const DetalleCompraSchema = z.object({
  id: z.number(),
  producto: ProductoDetalleSchema,
  cantidad: z.string(),
  costo: z.string(),
  inc_precio_venta: z.string(),
  precio_venta: z.string(),
  inc_precio_venta_alt: z.string(),
  precio_venta_alt: z.string(),
  moneda: z.string(),
  fecha_mod_precio: z.string().nullable(),
})

export const ProveedorDetalleSchema = z.object({
  id: z.number(),
  proveedor: z.string(),
  direccion: z.string().nullable(),
  nit: z.string().nullable(),
  contacto: z.string().nullable(),
})

export const ResponsableDetalleSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido_paterno: z.string(),
  apellido_materno: z.string().nullable(),
  dni: z.number(),
  celular: z.string().nullable(),
})

export const PurchaseDetailSchema = z.object({
  id: z.number(),
  fecha: z.string(),
  nro: z.string(),
  tipo_compra: z.string(),
  forma_compra: z.string(),
  proveedor: ProveedorDetalleSchema,
  responsable: ResponsableDetalleSchema.nullable(),
  cantidad_detalles: z.number(),
  detalles: z.array(DetalleCompraSchema),
  comprobante: z.string().nullable(),
  comprobante2: z.string().nullable(),
  comentarios: z.string().nullable(), // Campo agregado
})

export const PurchaseDetailResponseSchema = z.object({
  data: PurchaseDetailSchema,
})

export type PurchaseDetail = z.infer<typeof PurchaseDetailSchema>
export type DetalleCompra = z.infer<typeof DetalleCompraSchema>
export type ProductoDetalle = z.infer<typeof ProductoDetalleSchema>
export type ProveedorDetalle = z.infer<typeof ProveedorDetalleSchema>
export type ResponsableDetalle = z.infer<typeof ResponsableDetalleSchema>
export type CategoriaDetalle = z.infer<typeof CategoriaSchema>
