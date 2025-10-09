import { Logger } from "@/lib/logger";
import { ApiService } from "@/lib/apiService";
import type { BranchFilters, CreateBranch, CreateBranchResponse, GetAllBranches, GetByIdBranch, UpdateBranch } from "../types/branch.types";
import { BRANCH_ENDPOINTS } from "./endpoints/branchEndpoints.service";
import { CreateBranchResponseSchema, GetAllBranchesSchema, GetByIdBranchSchema } from "../schemas/branch.schema";

const MODULE_NAME = 'BRANCH_SERVICE';

export const branchesService = {
    /**
     * Crear una nueva sucursal
     * @param data - Datos de la sucursal a crear
     */
    async create(data: CreateBranch): Promise<CreateBranchResponse> {
        Logger.info('Creating Branch', { data }, MODULE_NAME);

        // Convertir a FormData para soportar multipart/form-data
        const formData = new FormData();
        formData.append('nombre', data.nombre);
        formData.append('sigla', data.sigla);
        formData.append('nombre_comercial', data.nombre_comercial);
        formData.append('direccion', data.direccion);
        formData.append('telefono', data.telefono);

        if (data.celular) {
            formData.append('celular', data.celular);
        }

        if (data.fax) {
            formData.append('fax', data.fax);
        }

        if (data.imagen) {
            formData.append('imagen', data.imagen);
        }

        const response = await ApiService.post(
            BRANCH_ENDPOINTS.create,
            formData,
            CreateBranchResponseSchema,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
            { unwrapData: true }
        );

        Logger.info(
            "Branch created successfully",
            undefined,
            MODULE_NAME
        );
        return response;
    },

    /**
     * Obtener todas las sucursales con filtros opcionales
     */
    async getAll(filters: Partial<BranchFilters>): Promise<GetAllBranches> {
        Logger.info('Fetching Branches', { filters }, MODULE_NAME);

        const response = await ApiService.get(
            BRANCH_ENDPOINTS.all,
            GetAllBranchesSchema,
            { params: filters }
        );

        Logger.info('Branches fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener una sucursal por ID
     * @param id - ID de la sucursal
     */
    async getById(id: number): Promise<GetByIdBranch> {
        Logger.info('Fetching Branch detail', { id }, MODULE_NAME);

        const response = await ApiService.get(
            BRANCH_ENDPOINTS.byId(id),
            GetByIdBranchSchema,
            undefined,
            { unwrapData: true }
        );

        Logger.info('Branch detail fetched successfully', {
            id
        }, MODULE_NAME);

        return response;
    },

    /**
     * Actualizar una sucursal por ID
     * @param id - ID de la sucursal
     * @param data - Datos para actualizar la sucursal
     */
    async update(id: number, data: UpdateBranch): Promise<CreateBranchResponse> {
        Logger.info('Updating Branch', { id, data }, MODULE_NAME);

        // Convertir a FormData para soportar multipart/form-data
        const formData = new FormData();
        formData.append('nombre', data.nombre);
        formData.append('sigla', data.sigla);
        formData.append('nombre_comercial', data.nombre_comercial);
        formData.append('direccion', data.direccion);
        formData.append('telefono', data.telefono);

        if (data.celular) {
            formData.append('celular', data.celular);
        }

        if (data.fax) {
            formData.append('fax', data.fax);
        }

        if (data.imagen) {
            formData.append('imagen', data.imagen);
        }

        const response = await ApiService.post(
            BRANCH_ENDPOINTS.update(id),
            formData,
            CreateBranchResponseSchema,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
            { unwrapData: true }
        );

        Logger.info('Branch updated successfully', {
            id
        }, MODULE_NAME);
        return response;
    },

    /**
     * Eliminar una sucursal por ID
     * @param id - ID de la sucursal
     */
    async delete(id: number): Promise<void> {
        Logger.info('Deleting Branch', { id }, MODULE_NAME);

        await ApiService.delete(BRANCH_ENDPOINTS.delete(id));

        Logger.info('Branch deleted successfully', { id }, MODULE_NAME);
    },
};
