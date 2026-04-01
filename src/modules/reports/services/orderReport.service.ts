import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { REPORT_ENDPOINTS } from "./reportEndpoints";
import type { AxiosRequestConfig } from "axios";
import type {
  OrderReportGeneralFilters,
  OrderReportGeneralResponse,
  OrderReportTiempoMedioFilters,
  OrderReportTiempoMedioResponse,
  OrderReportTopProveedoresFilters,
  OrderReportTopProveedoresResponse,
} from "../types/orderReport.types";
import {
  OrderReportGeneralFiltersSchema,
  OrderReportGeneralResponseSchema,
} from "../schemas/orders/generalOrderReport.schema";
import {
  OrderReportTopProveedoresFiltersSchema,
  OrderReportTopProveedoresResponseSchema,
} from "../schemas/orders/reportTopProviders.schema";
import {
  OrderReportTiempoMedioFiltersSchema,
  OrderReportTiempoMedioResponseSchema,
} from "../schemas/orders/reportTiempoMedio.schema";

const MODULE_NAME = "ORDER_REPORT_SERVICE";

/**
 * Construye un FormData a partir de un objeto de filtros,
 * omitiendo valores null/undefined.
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
 * Configuración Axios para descarga de Excel.
 */
const excelRequestConfig = (timeout?: number): AxiosRequestConfig => ({
  responseType: "blob",
  headers: {
    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  timeout: timeout ?? 120_000, // 2 minutos por defecto
});

export const orderReportService = {
  /**
   * Reporte general de pedidos a proveedores por línea de detalle.
   * - downloadable=true  → retorna Blob (Excel)
   * - downloadable=false → retorna JSON tipado
   */
  async getGeneral(
    filters: OrderReportGeneralFilters,
  ): Promise<OrderReportGeneralResponse | Blob> {
    Logger.info("Fetching Order general report", { filters }, MODULE_NAME);

    const validatedFilters = OrderReportGeneralFiltersSchema.parse(filters);
    const isDownloadable = validatedFilters.downloadable ?? false;

    const formData = createFormData({
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      sucursal: validatedFilters.sucursal,
      downloadable: isDownloadable,
    });

    if (isDownloadable) {
      const blob = await ApiService.post(
        REPORT_ENDPOINTS.orders.general,
        formData,
        undefined,
        excelRequestConfig(),
      );
      Logger.info("Order general report blob fetched", {}, MODULE_NAME);
      return blob as Blob;
    }

    const response = await ApiService.post(
      REPORT_ENDPOINTS.orders.general,
      formData,
      OrderReportGeneralResponseSchema,
    );

    Logger.info(
      "Order general report fetched",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as OrderReportGeneralResponse;
  },

  /**
   * Top N proveedores más recurridos por cantidad de apariciones en pedidos.
   * No soporta descarga Excel; siempre retorna JSON.
   */
  async getTopProveedores(
    filters: OrderReportTopProveedoresFilters,
  ): Promise<OrderReportTopProveedoresResponse> {
    Logger.info(
      "Fetching Order top proveedores report",
      { filters },
      MODULE_NAME,
    );

    const validatedFilters =
      OrderReportTopProveedoresFiltersSchema.parse(filters);

    const formData = createFormData({
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      sucursal: validatedFilters.sucursal,
      top_n: validatedFilters.top_n,
    });

    const response = await ApiService.post(
      REPORT_ENDPOINTS.orders.topProveedores,
      formData,
      OrderReportTopProveedoresResponseSchema,
    );

    Logger.info(
      "Order top proveedores report fetched",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as OrderReportTopProveedoresResponse;
  },

  /**
   * Tiempo medio en días entre fecha de solicitud y llegada del pedido,
   * por proveedor. Siempre retorna JSON.
   */
  async getTiempoMedio(
    filters: OrderReportTiempoMedioFilters,
  ): Promise<OrderReportTiempoMedioResponse> {
    Logger.info("Fetching Order tiempo medio report", { filters }, MODULE_NAME);

    const validatedFilters = OrderReportTiempoMedioFiltersSchema.parse(filters);

    const formData = createFormData({
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      sucursal: validatedFilters.sucursal,
    });

    const response = await ApiService.post(
      REPORT_ENDPOINTS.orders.tiempoMedio,
      formData,
      OrderReportTiempoMedioResponseSchema,
    );

    Logger.info(
      "Order tiempo medio report fetched",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as OrderReportTiempoMedioResponse;
  },
};
