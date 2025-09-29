import { z } from "zod"

export const ProductGetSchema = z.object({
    id: z.number(),
    descripcion: z.string(),
    codigo_oem: z.string().nullable(),
    codigo_upc: z.string().nullable(),
    modelo: z.string().nullable(),
    medida: z.string().nullable(),
    nro_motor: z.string().nullable(),
    categoria: z.string(),
    subcategoria: z.string().nullable(),
    marca: z.string(),
    procedencia: z.string(),
    unidad_medida: z.string(),
    stock_actual: z.preprocess((v) => Number(v), z.number()),
    stock_resto: z.preprocess((v) => Number(v), z.number()),
    stock_minimo: z.preprocess((v) => v === null ? null : Number(v), z.number().nullable()),
    pedido_transito: z.preprocess((v) => Number(v), z.number()),
    pedido_almacen: z.preprocess((v) => Number(v), z.number()),
    precio_venta: z.preprocess((v) => Number(v), z.number()),
    precio_venta_alt: z.preprocess((v) => Number(v), z.number()),
    sucursal: z.string(),
})