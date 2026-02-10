import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { ACCOUNT_PAYABLE_ENDPOINTS } from "./endpoints";
import {
  type AccountsReceivableGeneralFilters,
  type AccountsReceivablePaidFilters,
  type AccountsReceivableByCustomerFilters,
  type AccountsReceivableReportResponse,
} from "../types/AccountsReceivableReport.types";
import { accountsReceivableReportResponseSchema } from "../schemas/accountsReceivableReport.schema";
import type { AxiosRequestConfig } from "axios";

const MODULE_NAME = "ACCOUNTS_RECEIVABLE_REPORT_SERVICE";

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

export const accountsReceivableReportService = {
  /**
   * Obtener reporte general de cuentas por cobrar
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getGeneralReport(
    filters: AccountsReceivableGeneralFilters,
  ): Promise<AccountsReceivableReportResponse | Blob> {
    Logger.info(
      "Fetching accounts receivable general report",
      { filters },
      MODULE_NAME,
    );

    const isDownloadable = filters.downloadable ?? false;

    if (isDownloadable) {
      const blob = await ApiService.post(
        ACCOUNT_PAYABLE_ENDPOINTS.reports.general,
        filters,
        undefined,
        ExcelRequestConfig(180000), // 3 minutos para descarga
      );
      Logger.info("General report blob fetched successfully", {}, MODULE_NAME);
      return blob as Blob;
    }

    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.general,
      filters,
      accountsReceivableReportResponseSchema,
      { timeout: 120000 },
    );

    Logger.info(
      "General report fetched successfully",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as AccountsReceivableReportResponse;
  },

  /**
   * Obtener reporte de cuentas efectivamente pagadas
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getPaidReport(
    filters: AccountsReceivablePaidFilters,
  ): Promise<AccountsReceivableReportResponse | Blob> {
    Logger.info(
      "Fetching accounts receivable paid report",
      { filters },
      MODULE_NAME,
    );

    const isDownloadable = filters.downloadable ?? false;

    if (isDownloadable) {
      const blob = await ApiService.post(
        ACCOUNT_PAYABLE_ENDPOINTS.reports.paid,
        filters,
        undefined,
        ExcelRequestConfig(180000),
      );
      Logger.info("Paid report blob fetched successfully", {}, MODULE_NAME);
      return blob as Blob;
    }

    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.paid,
      filters,
      accountsReceivableReportResponseSchema,
      { timeout: 120000 },
    );

    Logger.info(
      "Paid report fetched successfully",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as AccountsReceivableReportResponse;
  },

  /**
   * Obtener reporte por cliente
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getByCustomerReport(
    filters: AccountsReceivableByCustomerFilters,
  ): Promise<AccountsReceivableReportResponse | Blob> {
    Logger.info(
      "Fetching accounts receivable by customer report",
      { filters },
      MODULE_NAME,
    );

    const isDownloadable = filters.downloadable ?? false;

    if (isDownloadable) {
      const blob = await ApiService.post(
        ACCOUNT_PAYABLE_ENDPOINTS.reports.byCustomer,
        filters,
        undefined,
        ExcelRequestConfig(180000),
      );
      Logger.info(
        "By customer report blob fetched successfully",
        {},
        MODULE_NAME,
      );
      return blob as Blob;
    }

    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.byCustomer,
      filters,
      accountsReceivableReportResponseSchema,
      { timeout: 120000 },
    );

    Logger.info(
      "By customer report fetched successfully",
      { count: response.data.length },
      MODULE_NAME,
    );

    return response as AccountsReceivableReportResponse;
  },
};
