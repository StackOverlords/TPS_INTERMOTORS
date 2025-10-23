import { Logger } from "@/lib/logger";
import { ApiService } from "@/lib/apiService";
import { TRANSFER_ENDPOINTS } from "./transferEndpoints.service";
import type { TransferCreate } from "../types/transferCreate.types";
import type { TransfersFilters } from "../types/transferFilters.types";
import type { TransfersGetAllResponse, TransferGetById } from "../types/transferGet.types";
import { TransfersGetAllSchema, TransferGetByIdSchema } from "../schemas/transferGetSchema";

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
};
