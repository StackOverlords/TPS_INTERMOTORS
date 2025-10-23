import { Logger } from "@/lib/logger";
import { ApiService } from "@/lib/apiService";
import type { BranchFilters, CreateBranch, CreateBranchResponse, GetAllBranches, GetByIdBranch, UpdateBranch, GetBranchUsers, BranchRoles, AddUserToBranch } from "../types/branch.types";
import { BRANCH_ENDPOINTS } from "./endpoints/branchEndpoints.service";
import { CreateBranchResponseSchema, GetAllBranchesSchema, GetByIdBranchSchema, GetBranchUsersSchema, BranchRolesSchema } from "../schemas/branch.schema";

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

    /**
     * Obtener usuarios de una sucursal
     * @param branchId - ID de la sucursal
     */
    async getBranchUsers(branchId: number): Promise<GetBranchUsers> {
        Logger.info('Fetching Branch Users', { branchId }, MODULE_NAME);

        const response = await ApiService.get(
            BRANCH_ENDPOINTS.getUsers(branchId),
            GetBranchUsersSchema
        );

        Logger.info('Branch Users fetched successfully', {
            branchId,
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener roles disponibles para usuarios de sucursales
     */
    async getBranchRoles(): Promise<BranchRoles> {
        Logger.info('Fetching Branch Roles', {}, MODULE_NAME);

        const response = await ApiService.get(
            BRANCH_ENDPOINTS.getRoles,
            BranchRolesSchema
        );

        Logger.info('Branch Roles fetched successfully', {}, MODULE_NAME);

        return response;
    },

    /**
     * Agregar un usuario a una sucursal
     * @param branchId - ID de la sucursal
     * @param data - Datos del usuario a agregar (usuario_id y rol)
     */
    async addUserToBranch(branchId: number, data: AddUserToBranch): Promise<void> {
        Logger.info('Adding User to Branch', { branchId, data }, MODULE_NAME);

        await ApiService.post(
            BRANCH_ENDPOINTS.addUser(branchId),
            data
        );

        Logger.info('User added to Branch successfully', {
            branchId,
            userId: data.usuario_id
        }, MODULE_NAME);
    },

    /**
     * Remover un usuario de una sucursal
     * @param branchId - ID de la sucursal
     * @param userId - ID del usuario
     */
    async removeUserFromBranch(branchId: number, userId: number): Promise<void> {
        Logger.info('Removing User from Branch', { branchId, userId }, MODULE_NAME);

        await ApiService.get(
            BRANCH_ENDPOINTS.removeUser(branchId, userId)
        );

        Logger.info('User removed from Branch successfully', {
            branchId,
            userId
        }, MODULE_NAME);
    },
};
