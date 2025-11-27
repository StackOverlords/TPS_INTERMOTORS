import { Logger } from "@/lib/logger";
import { ApiService } from "@/lib/apiService";
import { RETURN_ENDPOINTS } from "./returnEndpoints.service";
import type { ReturnCreate } from "../types/returnCreate.types";
import type { ReturnsFilters } from "../types/returnFilters.types";
import type { ReturnGetById, ReturnsGetAllResponse } from "../types/returnGet.types";
import { ReturnsGetAllSchema } from "../schemas/returnGetSchema";
import { ReturnByIdSchema } from "../schemas/returnGetByIdSchema";
import type { ReturnUpdate } from "../types/returnUpdate.types";

const MODULE_NAME = 'RETURN_SERVICE';

export const returnService = {
    /**
     * Crear una nueva devolucion
     * @param data - Datos de la devolucion a crear
    */
    async create(data: ReturnCreate): Promise<unknown> {
        Logger.info('Creating Return', { data }, MODULE_NAME);

        const response = await ApiService.post(
            RETURN_ENDPOINTS.create,
            data,
        );

        Logger.info(
            "Return created successfully",
            undefined,
            // response.data.id && { id: response.data.id },
            MODULE_NAME
        );
        return response
    },

    /**
     * Obtener todas las devoluciones con filtros opcionales
     */
    async getAll(filters: Partial<ReturnsFilters>): Promise<ReturnsGetAllResponse> {
        Logger.info('Fetching Returns', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            RETURN_ENDPOINTS.all,
            ReturnsGetAllSchema,
            { params: filters }
        );

        Logger.info('Returns fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener una devolucion por ID
     * @param id - ID de la devolucion
     */
    async getById(id: number): Promise<ReturnGetById> {
        Logger.info('Fetching Return', { id }, MODULE_NAME);

        const response = await ApiService.get(
            RETURN_ENDPOINTS.byId(id),
            ReturnByIdSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Return fetched successfully', { id }, MODULE_NAME);

        return response as ReturnGetById;
    },

    /**
     * Actualizar una devolucion por ID
     * @param id - ID de la devolucion
     * @param data - Datos para actualizar la devolucion
     */
    async update(id: number, data: ReturnUpdate): Promise<ReturnGetById> {
        Logger.info('Updating Return', { id, data }, MODULE_NAME);

        const response = await ApiService.put(
            RETURN_ENDPOINTS.update(id),
            data,
            ReturnByIdSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Return updated successfully', {
            id
        }, MODULE_NAME);
        return response as ReturnGetById;
    },

    /**
     * Eliminar una devolucion por ID
     * @param id - ID de la devolucion
     */
    async delete(id: number): Promise<void> {
        Logger.info('Deleting Return', { id }, MODULE_NAME);

        await ApiService.delete(RETURN_ENDPOINTS.delete(id));

        Logger.info('Return deleted successfully', { id }, MODULE_NAME);
    },

    /**
    * Eliminar detalle de una devolucion por ID
    * @param id - ID del detalle de una devolucion
    */
    async deleteDetail(id: number): Promise<void> {
        Logger.info('Deleting return detail', { id }, MODULE_NAME);

        await ApiService.delete(RETURN_ENDPOINTS.details.delete(id));

        Logger.info('Return detail deleted successfully', { id }, MODULE_NAME);
    },
};