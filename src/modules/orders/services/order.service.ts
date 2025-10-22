import { Logger } from "@/lib/logger";
import { ApiService } from "@/lib/apiService";
import type { OrderCreate } from "../types/orderCreate.types";
import { ORDER_ENDPOINTS } from "./orderEndpoints.service";
import type { OrderGetAllResponse, OrderGetById } from "../types/orderGet.types";
import { OrdersGetAllSchema } from "../schemas/orderGetSchema";
import { OrderByIdSchema } from "../schemas/orderGetByIdSchema";
import type { OrderUpdate } from "../types/orderUpdate.types";
import type { OrdersFilters } from "../types/orderFilters.types";

const MODULE_NAME = 'ORDER_SERVICE';

export const orderService = {
    /**
     * Crear un nuevo pedido
     * @param data - Datos del pedido a crear
    */
    async create(data: OrderCreate): Promise<unknown> {
        Logger.info('Creating Order', { data }, MODULE_NAME);

        const response = await ApiService.post(
            ORDER_ENDPOINTS.create,
            data,
        );

        Logger.info(
            "Order created successfully",
            undefined,
            // response.data.id && { id: response.data.id },
            MODULE_NAME
        );
        return response
    },

    /**
     * Obtener todas los pedidos con filtros opcionales
     */
    async getAll(filters: Partial<OrdersFilters>): Promise<OrderGetAllResponse> {
        Logger.info('Fetching Orders', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            ORDER_ENDPOINTS.all,
            OrdersGetAllSchema,
            { params: filters }
        );

        Logger.info('Orders fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener un pedido por ID
     * @param id - ID del pedido
     */
    async getById(id: number): Promise<OrderGetById> {
        Logger.info('Fetching Order', { id }, MODULE_NAME);

        const response = await ApiService.get(
            ORDER_ENDPOINTS.byId(id),
            OrderByIdSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Order fetched successfully', { id }, MODULE_NAME);

        return response as OrderGetById;
    },

    /**
     * Actualizar un pedido por ID
     * @param id - ID del pedido
     * @param data - Datos para actualizar el pedido
     */
    async update(id: number, data: OrderUpdate): Promise<OrderGetById> {
        Logger.info('Updating Order', { id, data }, MODULE_NAME);

        const response = await ApiService.put(
            ORDER_ENDPOINTS.update(id),
            data,
            OrderByIdSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Order updated successfully', {
            id
        }, MODULE_NAME);
        return response as OrderGetById;
    },

    /**
     * Eliminar un pedido por ID
     * @param id - ID del pedido
     */
    async delete(id: number): Promise<void> {
        Logger.info('Deleting Order', { id }, MODULE_NAME);

        await ApiService.delete(ORDER_ENDPOINTS.delete(id));

        Logger.info('Order deleted successfully', { id }, MODULE_NAME);
    },
};