import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { SaleGetByIdSchema } from "../schemas/saleGetbyid.schema";
import { salesGetAllResponseSchema } from "../schemas/salesGetAll.schema";
import type { Sale } from "../types/sale";
import type { SalesFilters } from "../types/salesFilters";
import type { SaleGetById, SalesGetAllResponse } from "../types/salesGetResponse";
import type { SaleUpdate } from "../types/saleUpdate.type";
import { SALE_ENDPOINTS } from "./saleEndpoints";

const MODULE_NAME = 'SALES_SERVICE';

export const salesService = {
    /**
     * Crear una nueva venta
     * @param data - Datos de la venta a crear
     */
    async create(data: Sale): Promise<unknown> {
        Logger.info('Creating sale', { data }, MODULE_NAME);

        const response = await ApiService.post(
            SALE_ENDPOINTS.create,
            data,
        );

        Logger.info(
            "Sale created successfully",
            undefined,
            // response.data.id && { id: response.data.id },
            MODULE_NAME
        );
        return response
    },

    /**
     * Obtener todas las ventas con filtros opcionales
     */
    async getAll(filters: Partial<SalesFilters>): Promise<SalesGetAllResponse> {
        Logger.info('Fetching sales', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            SALE_ENDPOINTS.all,
            salesGetAllResponseSchema,
            { params: filters }
        );

        Logger.info('Sales fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener una venta por ID
     * @param id - ID de la venta
     */
    async getById(id: number): Promise<SaleGetById> {
        Logger.info('Fetching sale detail', { id }, MODULE_NAME);

        const response = await ApiService.get(
            SALE_ENDPOINTS.byId(id),
            SaleGetByIdSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Sale detail fetched successfully', {
            id
        }, MODULE_NAME);

        return response as SaleGetById;
    },

    /**
     * Actualizar una venta por ID
     * @param id - ID de la venta
     * @param data - Datos para actualizar la venta
     */
    async update(id: number, data: SaleUpdate): Promise<SaleGetById> {
        Logger.info('Updating sale', { id, data }, MODULE_NAME);

        const response = await ApiService.put(
            SALE_ENDPOINTS.update(id),
            data,
            SaleGetByIdSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Sale updated successfully', {
            id
        }, MODULE_NAME);
        return response as SaleGetById;
    },

    /**
     * Eliminar una venta por ID
     * @param id - ID de la venta
     */
    async delete(id: number): Promise<void> {
        Logger.info('Deleting sale', { id }, MODULE_NAME);

        await ApiService.delete(SALE_ENDPOINTS.delete(id));

        Logger.info('Sale deleted successfully', { id }, MODULE_NAME);
    },
};