import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import z from "zod";

export const ItemSubcategorySchema = z.object({
    id: z.number(),
    subcategoria: z.string(),
    codigo_interno: z.number().nonnegative()
})

export const CategorySchema = z.object({
    id: z.number(),
    categoria: z.string(),
    subcategorias: z.array(ItemSubcategorySchema).nullable(),
});

export const GetAllCategoriesSchema = paginatedResponseSchema(CategorySchema)

export const CreateCategorySchema = CategorySchema.omit({
    id: true,
    subcategorias: true
})

export const UpdateCategorySchema = CategorySchema.omit({
    id: true,
    subcategorias: true
}).extend({
    patron_descripcion: z.string().max(500).optional()
})

export const SyncPreviewCategorySchema = z.object({
    total_categoria: z.number(),
    productos_afectados: z.number(),
    sin_match: z.number(),
})

export const GetByIdCategorySchema = CategorySchema.omit({
    subcategorias: true,
}).extend({
    codigo_interno: z.number().nonnegative()
})