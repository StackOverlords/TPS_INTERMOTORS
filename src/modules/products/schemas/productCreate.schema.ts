import z from "zod";

export const ProductCreateSchema = z.object({
    id_categoria: z
        .number()
        .min(1, "El campo Categoría es requerido").nonnegative(),
    id_subcategoria: z
        .number()
        .nonnegative()
        .default(0)
        .optional()
        .refine((val) => val! >= 0, "Subcategoría inválida"),
    descripcion: z.string().nonempty(),
    descripcion_alt: z.string().nonempty(),
    codigo_oem: z.string().nullable(),
    codigo_upc: z.string().nonempty(),
    modelo: z.string().nullable(),
    medida: z.string().nullable(),
    nro_motor: z.string().nullable(),
    costo_referencia: z.number().nonnegative(),
    stock_minimo: z.number().nonnegative(),
    precio_venta: z.number().nonnegative(),
    precio_venta_alt: z.number().nonnegative(),
    id_marca: z
        .number()
        .min(1, "El campo Marca es requerido").nonnegative(),
    id_procedencia: z
        .number()
        .min(1, "El campo Procedencia es requerido").nonnegative(),
    id_marca_vehiculo: z
        .number()
        .min(1, "El campo Marca Vehículo es requerido").nonnegative(),
    id_unidad: z
        .number()
        .min(1, "El campo Unidad de Medida es requerido").nonnegative(),
})