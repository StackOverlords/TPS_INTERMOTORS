import { ApiService } from "@/lib/apiService";
import logger from "@/utils/logger";
import { COMMON_EMPLOYEE_ENDPOINTS } from "./commonsEmployeesEndpoints.service";
import type { CatalogOptionList } from "@/modules/shared/types/catalog.types";
import { CatalogOptionResponseSchema } from "@/modules/shared/schemas/catalog.schema";
import { mapCatalogToOptions } from "@/modules/shared/utils/catalog.utils";

const MODULE_NAME = "COMMON_EMPLOYEE_SERVICE";

export const commonsEmployeesService = {
  /**
   * Obtener tipos de género
   */
  async getGenderTypes(): Promise<CatalogOptionList> {
    logger.info("Fetching Gender types", undefined, MODULE_NAME);

    const response = await ApiService.get(
      COMMON_EMPLOYEE_ENDPOINTS.gender_types,
      CatalogOptionResponseSchema,
    );

    logger.info("Gender types fetched successfully", undefined, MODULE_NAME);

    return mapCatalogToOptions(response);
  },

  /**
   * Obtener tipos de DNI
   */
  async getDniTypes(): Promise<CatalogOptionList> {
    logger.info("Fetching DNI types", undefined, MODULE_NAME);

    const response = await ApiService.get(
      COMMON_EMPLOYEE_ENDPOINTS.dni_types,
      CatalogOptionResponseSchema,
    );

    logger.info(
      "DNI types fetched successfully",
      { count: Object.keys(response).length },
      MODULE_NAME,
    );

    return mapCatalogToOptions(response);
  },
};
