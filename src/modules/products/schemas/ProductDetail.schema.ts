import { toNumberOrZero, toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
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
    codigo_interno: toNumberOrZero,
    descripcion: z.string(),
    descripcion_alt: z.string().nullable(),
    codigo_oem: z.string().nullable(),
    codigo_upc: z.string().nullable(),
    modelo: z.string().nullable(),
    medida: z.string().nullable(),
    nro_motor: z.string().nullable(),
    costo_referencia: toNumberOrZeroStrict,
    stock_minimo: toNumberOrZeroStrict,
    precio_venta: toNumberOrZero,
    precio_venta_alt: toNumberOrZero,

    id_categoria: toNumberOrZeroStrict,
    categoria: ProductCategoriaSchema.nullable(),

    id_subcategora: z.number().nullable(),
    subcategoria: ProductSubcategoriaSchema.nullable(),

    id_marca: toNumberOrZeroStrict,
    marca: ProductMarcaSchema.nullable(),

    id_procedencia: toNumberOrZeroStrict,
    procedencia: ProductProcedenciaSchema.nullable(),

    id_unidad_medida: toNumberOrZeroStrict,
    unidad_medida: ProductUnidadMedidaSchema.nullable(),

    id_marca_vehiculo: toNumberOrZeroStrict,
    marca_vehiculo: ProductMarcaVehiculoSchema.nullable(),
    imagen: z.string().nullable(),
    imagen_name: z.string().nullable(),
    imagen_ext: z.string().nullable(),
    stock_actual: toNumberOrZero.optional(),
});