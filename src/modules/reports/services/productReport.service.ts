import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { REPORT_ENDPOINTS } from "./reportEndpoints";
import type { AxiosRequestConfig } from "axios";
import type {
  KardexReportFilters,
  KardexReportResponse,
} from "../types/kardexReport.types";
import {
  KardexReportFiltersSchema,
  KardexReportResponseSchema,
} from "../schemas/products/kardexReportProduct.schema";

const MODULE_NAME = "PRODUCT_REPORT_SERVICE";

/**
 * Crear FormData desde filtros
 */
const createFormData = (filters: Record<string, unknown>): FormData => {
  const formData = new FormData();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  return formData;
};

/**
 * Configuracion para descargar excel
 */
const ExcelRequestConfig = (timeout?: number): AxiosRequestConfig => {
  return {
    responseType: "blob",
    headers: {
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    timeout: timeout || 120000, // 2 minutos por defecto
  };
};

export const productReportService = {
  /**
   * Obtener reporte Kardex de productos
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getKardexReport(
    filters: KardexReportFilters,
  ): Promise<KardexReportResponse | Blob> {
    Logger.info("Fetching Kardex report", { filters }, MODULE_NAME);

    const validatedFilters = KardexReportFiltersSchema.parse(filters);
    const isDownloadable = validatedFilters.downloadable ?? false;

    const formData = createFormData({
      producto: validatedFilters.producto,
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      sucursal: validatedFilters.sucursal,
      downloadable: isDownloadable,
    });

    if (isDownloadable) {
      const blob = await ApiService.post(
        REPORT_ENDPOINTS.products.kardex,
        formData,
        undefined,
        ExcelRequestConfig(),
      );
      Logger.info("Kardex report blob fetched successfully", {}, MODULE_NAME);
      return blob as Blob;
    }

    const response = await ApiService.post(
      REPORT_ENDPOINTS.products.kardex,
      formData,
      KardexReportResponseSchema,
    );

    Logger.info(
      "Kardex report fetched successfully",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as KardexReportResponse;
  },
};
