import { ApiService } from "@/lib/apiService";
import Logger from "@/utils/logger";
import { ACCOUNT_PAYABLE_ENDPOINTS } from "./endpoints";
import {
  type AccountsReceivableGeneralFilters,
  type AccountsReceivablePaidFilters,
  type AccountsReceivableByCustomerFilters,
  type AccountsReceivableReportResponse,
} from "../types/AccountsReceivableReport.types";
import { accountsReceivableReportResponseSchema } from "../schemas/accountsReceivableReport.schema";

const MODULE_NAME = "AccountsReceivableReportService";

export const accountsReceivableReportService = {
  /**
   * Obtener reporte general de cuentas por cobrar
   * @param filters - Filtros para el reporte
   */
  async getGeneralReport(filters: AccountsReceivableGeneralFilters): Promise<AccountsReceivableReportResponse> {
    Logger.info("Fetching accounts receivable general report", { filters }, MODULE_NAME);
    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.general,
      filters,
      accountsReceivableReportResponseSchema,
      { timeout: 120000 } // 2 minutos para reportes pesados
    );
    Logger.info("General report fetched successfully", { count: response.data.length }, MODULE_NAME);
    return response as AccountsReceivableReportResponse;
  },

  /**
   * Descargar reporte general en Excel
   * @param filters - Filtros para el reporte
   */
  async downloadGeneralReport(filters: AccountsReceivableGeneralFilters): Promise<Blob> {
    Logger.info("Downloading accounts receivable general report", { filters }, MODULE_NAME);
    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.general,
      { ...filters, downloadable: true },
      undefined,
      {
        timeout: 180000, // 3 minutos para descarga de Excel
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      }
    );
    Logger.info("General report downloaded successfully", {}, MODULE_NAME);
    return response as Blob;
  },

  /**
   * Obtener reporte de cuentas efectivamente pagadas
   * @param filters - Filtros para el reporte
   */
  async getPaidReport(filters: AccountsReceivablePaidFilters): Promise<AccountsReceivableReportResponse> {
    Logger.info("Fetching accounts receivable paid report", { filters }, MODULE_NAME);
    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.paid,
      filters,
      accountsReceivableReportResponseSchema,
      { timeout: 120000 }
    );
    Logger.info("Paid report fetched successfully", { count: response.data.length }, MODULE_NAME);
    return response as AccountsReceivableReportResponse;
  },

  /**
   * Descargar reporte de pagadas en Excel
   * @param filters - Filtros para el reporte
   */
  async downloadPaidReport(filters: AccountsReceivablePaidFilters): Promise<Blob> {
    Logger.info("Downloading accounts receivable paid report", { filters }, MODULE_NAME);
    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.paid,
      { ...filters, downloadable: true },
      undefined,
      {
        timeout: 180000,
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      }
    );
    Logger.info("Paid report downloaded successfully", {}, MODULE_NAME);
    return response as Blob;
  },

  /**
   * Obtener reporte por cliente
   * @param filters - Filtros para el reporte
   */
  async getByCustomerReport(filters: AccountsReceivableByCustomerFilters): Promise<AccountsReceivableReportResponse> {
    Logger.info("Fetching accounts receivable by customer report", { filters }, MODULE_NAME);
    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.byCustomer,
      filters,
      accountsReceivableReportResponseSchema,
      { timeout: 120000 }
    );
    Logger.info("By customer report fetched successfully", { count: response.data.length }, MODULE_NAME);
    return response as AccountsReceivableReportResponse;
  },

  /**
   * Descargar reporte por cliente en Excel
   * @param filters - Filtros para el reporte
   */
  async downloadByCustomerReport(filters: AccountsReceivableByCustomerFilters): Promise<Blob> {
    Logger.info("Downloading accounts receivable by customer report", { filters }, MODULE_NAME);
    const response = await ApiService.post(
      ACCOUNT_PAYABLE_ENDPOINTS.reports.byCustomer,
      { ...filters, downloadable: true },
      undefined,
      {
        timeout: 180000,
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      }
    );
    Logger.info("By customer report downloaded successfully", {}, MODULE_NAME);
    return response as Blob;
  },
};
