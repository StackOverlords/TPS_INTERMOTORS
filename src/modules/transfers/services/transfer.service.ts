import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { TransferGetByIdSchema, TransfersGetAllSchema } from "../schemas/transferGetSchema";
import type { TransferCreate } from "../types/transferCreate.types";
import type { TransfersFilters } from "../types/transferFilters.types";
import type { TransferGetById, TransfersGetAllResponse } from "../types/transferGet.types";
import { TRANSFER_ENDPOINTS } from "./transferEndpoints.service";

const MODULE_NAME = 'TRANSFER_SERVICE';

export const transferService = {
    /**
     * Crear una nueva transferencia
     * @param data - Datos de la transferencia a crear
    */
    async create(data: TransferCreate): Promise<unknown> {
        Logger.info('Creating Transfer', { data }, MODULE_NAME);

        const response = await ApiService.post(
            TRANSFER_ENDPOINTS.create,
            data,
        );

        Logger.info(
            "Transfer created successfully",
            undefined,
            MODULE_NAME
        );
        return response;
    },

    /**
     * Obtener todas las transferencias con filtros opcionales
     */
    async getAll(filters: Partial<TransfersFilters>): Promise<TransfersGetAllResponse> {
        Logger.info('Fetching Transfers', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            TRANSFER_ENDPOINTS.all,
            TransfersGetAllSchema,
            { params: filters }
        );

        Logger.info('Transfers fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener una transferencia por ID
     * @param id - ID de la transferencia
     */
    async getById(id: number): Promise<TransferGetById> {
        Logger.info('Fetching Transfer', { id }, MODULE_NAME);

        const response = await ApiService.get(
            TRANSFER_ENDPOINTS.byId(id),
            TransferGetByIdSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Transfer fetched successfully', { id }, MODULE_NAME);

        return response as TransferGetById;
    },

    /**
     * Eliminar una transferencia por ID
     * @param id - ID de la transferencia
     */
    async delete(id: number): Promise<void> {
        Logger.info('Deleting Transfer', { id }, MODULE_NAME);

        await ApiService.delete(TRANSFER_ENDPOINTS.delete(id));

        Logger.info('Transfer deleted successfully', { id }, MODULE_NAME);
    },

    /**
     * Enviar una transferencia (marcarla como enviada)
     * @param id - ID de la transferencia
     */
    async send(id: number): Promise<unknown> {
        Logger.info('Sending Transfer', { id }, MODULE_NAME);

        const response = await ApiService.get(
            TRANSFER_ENDPOINTS.send(id)
        );

        Logger.info('Transfer sent successfully', { id }, MODULE_NAME);
        return response;
    },

    /**
     * Aceptar/Recibir una transferencia
     * @param id - ID de la transferencia
     */
    async accept(id: number): Promise<unknown> {
        Logger.info('Accepting Transfer', { id }, MODULE_NAME);

        const response = await ApiService.get(
            TRANSFER_ENDPOINTS.accept(id)
        );

        Logger.info('Transfer accepted successfully', { id }, MODULE_NAME);
        return response;
    },

    /**
     * Actualizar una transferencia por ID
     * @param id - ID de la transferencia
     * @param data - Datos para actualizar la transferencia
     */
    async update(id: number, data: any): Promise<TransferGetById> {
        Logger.info('Updating Transfer', { id, data }, MODULE_NAME);

        const response = await ApiService.put(
            TRANSFER_ENDPOINTS.update(id),
            data,
            TransferGetByIdSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Transfer updated successfully', { id }, MODULE_NAME);
        return response as TransferGetById;
    },
};
