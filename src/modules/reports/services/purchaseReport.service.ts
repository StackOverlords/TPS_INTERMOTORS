import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import {
  PurchaseReportGeneralResponseSchema,
  PurchaseReportGeneralFiltersSchema,
} from "../schemas/purchases/reportPurchaseGeneral.schema";
import {
  PurchaseReportMasCompradoResponseSchema,
  PurchaseReportMasCompradoFiltersSchema,
} from "../schemas/purchases/reportPurchaseMasComprado.schema";
import {
  PurchaseReportMayorCostoResponseSchema,
  PurchaseReportMayorCostoFiltersSchema,
} from "../schemas/purchases/reportPurchaseMayorCosto.schema";
import type {
  PurchaseReportGeneralResponse,
  PurchaseReportGeneralFilters,
  PurchaseReportMasCompradoResponse,
  PurchaseReportMasCompradoFilters,
  PurchaseReportMayorCostoResponse,
  PurchaseReportMayorCostoFilters,
} from "../types/purchaseReport.types";
import type { AxiosRequestConfig } from "axios";
import { REPORT_ENDPOINTS } from "./reportEndpoints";

const MODULE_NAME = "PURCHASE_REPORT_SERVICE";

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
 * Configuración para descargar excel
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

export const purchaseReportService = {
  /**
   * Obtener reporte general de compras agrupado por producto
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getGeneral(
    filters: PurchaseReportGeneralFilters,
  ): Promise<PurchaseReportGeneralResponse | Blob> {
    Logger.info("Fetching purchase general report", { filters }, MODULE_NAME);

    const validatedFilters = PurchaseReportGeneralFiltersSchema.parse(filters);
    const isDownloadable = validatedFilters.downloadable ?? false;

    const formData = createFormData({
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      sucursal: validatedFilters.sucursal,
      downloadable: isDownloadable,
    });

    if (isDownloadable) {
      const blob = await ApiService.post(
        REPORT_ENDPOINTS.purchases.general,
        formData,
        undefined,
        ExcelRequestConfig(),
      );
      Logger.info(
        "Purchase general report blob fetched successfully",
        {},
        MODULE_NAME,
      );
      return blob as Blob;
    }

    const response = await ApiService.post(
      REPORT_ENDPOINTS.purchases.general,
      formData,
      PurchaseReportGeneralResponseSchema,
    );

    Logger.info(
      "Purchase general report fetched successfully",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as PurchaseReportGeneralResponse;
  },

  /**
   * Obtener ranking de productos más comprados por cantidad
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getMasComprado(
    filters: PurchaseReportMasCompradoFilters,
  ): Promise<PurchaseReportMasCompradoResponse | Blob> {
    Logger.info("Fetching most purchased report", { filters }, MODULE_NAME);

    const validatedFilters =
      PurchaseReportMasCompradoFiltersSchema.parse(filters);
    const isDownloadable = validatedFilters.downloadable ?? false;

    const formData = createFormData({
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      ranking: validatedFilters.ranking,
      sucursal: validatedFilters.sucursal,
      downloadable: isDownloadable,
    });

    if (isDownloadable) {
      const blob = await ApiService.post(
        REPORT_ENDPOINTS.purchases.masComprado,
        formData,
        undefined,
        ExcelRequestConfig(),
      );
      Logger.info(
        "Most purchased report blob fetched successfully",
        {},
        MODULE_NAME,
      );
      return blob as Blob;
    }

    const response = await ApiService.post(
      REPORT_ENDPOINTS.purchases.masComprado,
      formData,
      PurchaseReportMasCompradoResponseSchema,
    );

    Logger.info(
      "Most purchased report fetched successfully",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as PurchaseReportMasCompradoResponse;
  },

  /**
   * Obtener ranking de productos con mayor costo total de compra
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getMayorCosto(
    filters: PurchaseReportMayorCostoFilters,
  ): Promise<PurchaseReportMayorCostoResponse | Blob> {
    Logger.info("Fetching top cost report", { filters }, MODULE_NAME);

    const validatedFilters =
      PurchaseReportMayorCostoFiltersSchema.parse(filters);
    const isDownloadable = validatedFilters.downloadable ?? false;

    const formData = createFormData({
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      ranking: validatedFilters.ranking,
      sucursal: validatedFilters.sucursal,
      downloadable: isDownloadable,
    });

    if (isDownloadable) {
      const blob = await ApiService.post(
        REPORT_ENDPOINTS.purchases.mayorCosto,
        formData,
        undefined,
        ExcelRequestConfig(),
      );
      Logger.info("Top cost report blob fetched successfully", {}, MODULE_NAME);
      return blob as Blob;
    }

    const response = await ApiService.post(
      REPORT_ENDPOINTS.purchases.mayorCosto,
      formData,
      PurchaseReportMayorCostoResponseSchema,
    );

    Logger.info(
      "Top cost report fetched successfully",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as PurchaseReportMayorCostoResponse;
  },
};
