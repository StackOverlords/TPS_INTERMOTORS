import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { TransferBranchesGetAllSchema, TransferResponsiblesGetAllSchema } from "../../schemas/commons/transferCommons.schema";
import type { TransferBranchesGetAll, TransferResponsiblesGetAll } from "../../types/commons/transferCommons.types";
import { TRANSFER_COMMONS_ENDPOINTS } from "../transferCommonsEndpoints.service";

const MODULE_NAME = 'TRANSFER_COMMONS_SERVICE';

export const transferCommonsService = {
    /**
     * Obtener todos los responsables
     */
    async getResponsibles(): Promise<TransferResponsiblesGetAll> {
        Logger.info('Fetching Transfer Responsibles', undefined, MODULE_NAME);

        const response = await ApiService.get(
            TRANSFER_COMMONS_ENDPOINTS.responsibles,
            TransferResponsiblesGetAllSchema
        );

        Logger.info('Transfer Responsibles fetched successfully', {
            count: response.data.length,
        }, MODULE_NAME);

        return response;
    },

    /**
     * Obtener sucursales disponibles para transferir
     * @param branchId - ID de la sucursal origen
     */
    async getBranches(branchId: number): Promise<TransferBranchesGetAll> {
        // Logger.info('Fetching Transfer Branches', { branchId }, MODULE_NAME);
        console.log(branchId)
        const response = await ApiService.get(
            TRANSFER_COMMONS_ENDPOINTS.branches(branchId),
            TransferBranchesGetAllSchema
        );
        console.log(response,"assx")

        // Logger.info('Transfer Branches fetched successfully', {
        //     count: response.data.length,
        // }, MODULE_NAME);

        return response;
    },

    /**
     * Convierte los datos de responsables o sucursales a opciones para ComboboxSelect
     */
    convertToOptions(data: { id: number; nombre?: string; sigla?: string }[]): Array<{ id: number; label: string }> {
        return data.map((item) => ({
            id: item.id,
            label: item.nombre || item.sigla || `ID: ${item.id}`,
        }));
    },
};
