import { Logger } from "@/lib/logger"
import { ApiService } from "@/lib/apiService"
import type { ReturnResponsiblesGetAll, ReturnTypesList } from "../../types/commons/returnCommons.types";
import { RETURNCOMMONS_ENDPOINTS } from "./returnCommonsEndpoints.service";
import { ReturnTypesResponseSchema } from "../../schemas/commons/returnTypes.schema";
import { ReturnResponsiblesGetAllSchema } from "../../schemas/commons/returnResponsibles.schema";

const MODULE_NAME = "RETURN_COMMONS_SERVICE";

export const returnCommonsService = {
    /**
     * Obtener tipos de la devolucion
     */
    async getReturnTypes(): Promise<ReturnTypesList> {
        Logger.info("Fetching Return types", undefined, MODULE_NAME);

        const response = await ApiService.get(
            RETURNCOMMONS_ENDPOINTS.types,
            ReturnTypesResponseSchema
        );

        Logger.info("Return types fetched successfully", { count: Object.keys(response).length }, MODULE_NAME);

        return this.convertToOptions(response);
    },

    /**
     * Obtener responsables de la devolucion
     */
    async getReturnResponsibles(): Promise<ReturnResponsiblesGetAll> {
        Logger.info("Fetching Return responsibles", undefined, MODULE_NAME);

        const response = await ApiService.get(
            RETURNCOMMONS_ENDPOINTS.responsibles,
            ReturnResponsiblesGetAllSchema,
            undefined,
        );

        Logger.info("Return responsibles fetched successfully", { count: response.data.length }, MODULE_NAME);

        return response;
    },

    /**
     * Convertir en opciones para selects
     */
    convertToOptions(data: Record<string, string>) {
        return Object.entries(data).map(([id, label]) => ({
            id,
            label
        }));
    },
};