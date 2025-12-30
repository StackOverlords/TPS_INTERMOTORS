import { ProductGetSchema } from "@/modules/products/schemas/product.schema"

export const CartProductSchema = ProductGetSchema.pick({
    id: true,
    descripcion: true,
    codigo_oem: true,
    codigo_upc: true,
    precio_venta: true,
    precio_venta_alt: true,
    stock_actual: true,
    marca: true,
    unidad_medida: true,
    sucursal: true,
    categoria: true,
    medida: true,
})