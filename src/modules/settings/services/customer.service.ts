// import { Logger } from "@/lib/logger";
import { ApiService } from "@/lib/apiService";
import type { CustomerFilters, CreateCustomer, GetAllCustomers, GetByIdCustomer, UpdateCustomer } from "../types/customer.types";
import { CUSTOMER_ENDPOINTS } from "./endpoints/customerEndpoints.service";
import { GetAllCustomersSchema, GetByIdCustomerSchema } from "../schemas/customer.schema";
import logger from "@/utils/logger";

const MODULE_NAME = 'CUSTOMER_SERVICE';

export const customersService = {
    /**
     * Crear un nuevo cliente
     * @param data - Datos del cliente a crear
     */
    async create(data: CreateCustomer): Promise<GetByIdCustomer> {
        logger.info('Creating Customer', { data }, MODULE_NAME);

        const response = await ApiService.post(
            CUSTOMER_ENDPOINTS.create,
            data,
            GetByIdCustomerSchema,
            undefined,
            { unwrapData: true }
        );

        logger.info(
            "Customer created successfully",
            undefined,
            MODULE_NAME
        );
        return response;
    },

    /**
     * Obtener todos los clientes con filtros opcionales
     */
    async getAll(filters: Partial<CustomerFilters>): Promise<GetAllCustomers> {
        logger.info('Fetching Customers', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            CUSTOMER_ENDPOINTS.all,
            GetAllCustomersSchema,
            { params: filters }
        );

        logger.info('Customers fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener un cliente por ID
     * @param id - ID del cliente
     */
    async getById(id: number): Promise<GetByIdCustomer> {
        logger.info('Fetching Customer detail', { id }, MODULE_NAME);

        const response = await ApiService.get(
            CUSTOMER_ENDPOINTS.byId(id),
            GetByIdCustomerSchema,
            undefined,
            { unwrapData: true }
        );

        logger.info('Customer detail fetched successfully', {
            id
        }, MODULE_NAME);

        return response;
    },

    /**
     * Actualizar un cliente por ID
     * @param id - ID del cliente
     * @param data - Datos para actualizar el cliente
     */
    async update(id: number, data: UpdateCustomer): Promise<GetByIdCustomer> {
        logger.info('Updating Customer', { id, data }, MODULE_NAME);

        const response = await ApiService.put(
            CUSTOMER_ENDPOINTS.update(id),
            data,
            GetByIdCustomerSchema,
            undefined,
            { unwrapData: true }
        );

        logger.info('Customer updated successfully', {
            id
        }, MODULE_NAME);
        return response;
    },

    /**
     * Eliminar un cliente por ID
     * @param id - ID del cliente
     */
    async delete(id: number): Promise<void> {
        logger.info('Deleting Customer', { id }, MODULE_NAME);

        await ApiService.delete(CUSTOMER_ENDPOINTS.delete(id));

        logger.info('Customer deleted successfully', { id }, MODULE_NAME);
    },
};
