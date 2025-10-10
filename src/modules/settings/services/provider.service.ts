import { Logger } from "@/lib/logger";
import { ApiService } from "@/lib/apiService";
import type { ProviderFilters, CreateProvider, GetAllProviders, GetByIdProvider, UpdateProvider } from "../types/provider.types";
import { PROVIDER_ENDPOINTS } from "./endpoints/providerEndpoints.service";
import { GetAllProvidersSchema, GetByIdProviderSchema } from "../schemas/provider.schema";

const MODULE_NAME = 'PROVIDER_SERVICE';

export const providersService = {
    /**
     * Crear un nuevo proveedor
     * @param data - Datos del proveedor a crear
     */
    async create(data: CreateProvider): Promise<GetByIdProvider> {
        Logger.info('Creating Provider', { data }, MODULE_NAME);

        const response = await ApiService.post(
            PROVIDER_ENDPOINTS.create,
            data,
            GetByIdProviderSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info(
            "Provider created successfully",
            undefined,
            MODULE_NAME
        );
        return response;
    },

    /**
     * Obtener todos los proveedores con filtros opcionales
     */
    async getAll(filters: Partial<ProviderFilters>): Promise<GetAllProviders> {
        Logger.info('Fetching Providers', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            PROVIDER_ENDPOINTS.all,
            GetAllProvidersSchema,
            { params: filters }
        );

        Logger.info('Providers fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener un proveedor por ID
     * @param id - ID del proveedor
     */
    async getById(id: number): Promise<GetByIdProvider> {
        Logger.info('Fetching Provider detail', { id }, MODULE_NAME);

        const response = await ApiService.get(
            PROVIDER_ENDPOINTS.byId(id),
            GetByIdProviderSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Provider detail fetched successfully', {
            id
        }, MODULE_NAME);

        return response;
    },

    /**
     * Actualizar un proveedor por ID
     * @param id - ID del proveedor
     * @param data - Datos para actualizar el proveedor
     */
    async update(id: number, data: UpdateProvider): Promise<GetByIdProvider> {
        Logger.info('Updating Provider', { id, data }, MODULE_NAME);

        const response = await ApiService.put(
            PROVIDER_ENDPOINTS.update(id),
            data,
            GetByIdProviderSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Provider updated successfully', {
            id
        }, MODULE_NAME);
        return response;
    },

    /**
     * Eliminar un proveedor por ID
     * @param id - ID del proveedor
     */
    async delete(id: number): Promise<void> {
        Logger.info('Deleting Provider', { id }, MODULE_NAME);

        await ApiService.delete(PROVIDER_ENDPOINTS.delete(id));

        Logger.info('Provider deleted successfully', { id }, MODULE_NAME);
    },
};
