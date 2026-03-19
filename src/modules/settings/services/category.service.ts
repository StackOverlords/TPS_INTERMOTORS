import { Logger } from "@/lib/logger";
import { ApiService } from "@/lib/apiService";
import type { CategoryFilters, CreateCategory, GetAllCategories, GetByIdCategory, SyncPreviewCategory, UpdateCategory } from "../types/category.types";
import { CATEGORY_ENDPOINTS } from "./endpoints/categoryEndpoints.service";
import { GetAllCategoriesSchema, GetByIdCategorySchema, SyncPreviewCategorySchema } from "../schemas/category.schema";

const MODULE_NAME = 'CATEGORY_SERVICE';

export const categoriesService = {
    /**
     * Crear una nueva categoria
     * @param data - Datos de la categoria a crear
     */
    async create(data: CreateCategory): Promise<GetByIdCategory> {
        Logger.info('Creating Category', { data }, MODULE_NAME);

        const response = await ApiService.post(
            CATEGORY_ENDPOINTS.create,
            data,
            GetByIdCategorySchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info(
            "Category created successfully",
            undefined,
            MODULE_NAME
        );
        return response
    },

    /**
     * Obtener todas las categorias con filtros opcionales
     */
    async getAll(filters: Partial<CategoryFilters>): Promise<GetAllCategories> {
        Logger.info('Fetching Categories', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            CATEGORY_ENDPOINTS.all,
            GetAllCategoriesSchema,
            { params: filters }
        );

        Logger.info('Categories fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener una categoria por ID
     * @param id - ID de la categoria
     */
    async getById(id: number): Promise<GetByIdCategory> {
        Logger.info('Fetching Category detail', { id }, MODULE_NAME);

        const response = await ApiService.get(
            CATEGORY_ENDPOINTS.byId(id),
            GetByIdCategorySchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Category detail fetched successfully', {
            id
        }, MODULE_NAME);

        return response;
    },

    /**
     * Actualizar una categoria por ID
     * @param id - ID de la categoria
     * @param data - Datos para actualizar la categoria
     */
    async update(id: number, data: UpdateCategory): Promise<GetByIdCategory> {
        Logger.info('Updating Category', { id, data }, MODULE_NAME);

        const response = await ApiService.put(
            CATEGORY_ENDPOINTS.update(id),
            data,
            GetByIdCategorySchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Category updated successfully', {
            id
        }, MODULE_NAME);
        return response;
    },

    /**
     * Preview de cuántos productos se verían afectados al sincronizar el nombre de la categoría
     * @param id - ID de la categoría
     * @param patron_descripcion - Patrón a buscar en las descripciones de productos
     */
    async syncPreview(id: number, patron_descripcion: string): Promise<SyncPreviewCategory> {
        Logger.info('Fetching Category sync preview', { id, patron_descripcion }, MODULE_NAME);

        const response = await ApiService.get(
            CATEGORY_ENDPOINTS.syncPreview(id),
            SyncPreviewCategorySchema,
            { params: { patron_descripcion } }
        );

        Logger.info('Category sync preview fetched', { id }, MODULE_NAME);
        return response;
    },

    /**
     * Eliminar una categoria por ID
     * @param id - ID de la categoria
     */
    async delete(id: number): Promise<void> {
        Logger.info('Deleting Category', { id }, MODULE_NAME);

        await ApiService.delete(CATEGORY_ENDPOINTS.delete(id));

        Logger.info('Category deleted successfully', { id }, MODULE_NAME);
    },
};