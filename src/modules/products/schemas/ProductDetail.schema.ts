import { z } from "zod";

export const ProductCategoriaSchema = z.object({
    id: z.number(),
    categoria: z.string(),
    id_estado: z.string(),
    codigo_interno: z.number(),
    version: z.number().nullable(),
});

export const ProductSubcategoriaSchema = z.object({
    id: z.number(),
    subcategoria: z.string(),
    id_categoria: z.number(),
    id_estado: z.string(),
    codigo_interno: z.number(),
});

export const ProductMarcaSchema = z.object({
    id: z.number(),
    marca: z.string(),
    id_estado: z.string(),
    codigo_interno: z.number(),
});

export const ProductProcedenciaSchema = z.object({
    id: z.number(),
    procedencia: z.string(),
    id_estado: z.string(),
    codigo_interno: z.number(),
});

export const ProductUnidadMedidaSchema = z.object({
    id: z.number(),
    unidad_medida: z.string(),
    id_estado: z.string(),
    codigo_interno: z.number(),
});

export const ProductMarcaVehiculoSchema = z.object({
    id: z.number(),
    marca_vehiculo: z.string(),
    codigo_interno: z.number(),
    id_estado: z.string(),
});

// Esquema principal

export const ProductDetailSchema = z.object({
    id: z.number(),
    codigo_interno: z.number(),
    descripcion: z.string(),
    descripcion_alt: z.string().nullable(),
    codigo_oem: z.string().nullable(),
    codigo_upc: z.string().nullable(),
    modelo: z.string().nullable(),
    medida: z.string().nullable(),
    nro_motor: z.string().nullable(),
    costo_referencia: z.preprocess((v) => v === null ? null : Number(v), z.number().nullable()),
    stock_minimo: z.preprocess((v) => v === null ? null : Number(v), z.number().nullable()),
    precio_venta: z.preprocess((v) => Number(v), z.number()),
    precio_venta_alt: z.preprocess((v) => Number(v), z.number()),

    id_categoria: z.number(),
    categoria: ProductCategoriaSchema.nullable(),

    id_subcategora: z.number().nullable(),
    subcategoria: ProductSubcategoriaSchema.nullable(),

    id_marca: z.number(),
    marca: ProductMarcaSchema.nullable(),

    id_procedencia: z.number(),
    procedencia: ProductProcedenciaSchema,

    id_unidad_medida: z.number(),
    unidad_medida: ProductUnidadMedidaSchema,

    id_marca_vehiculo: z.number(),
    marca_vehiculo: ProductMarcaVehiculoSchema.nullable(),
});