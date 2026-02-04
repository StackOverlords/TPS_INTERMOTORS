import { ApiService } from '@/lib/apiService';
import { Logger } from '@/lib/logger';
import {
  ReportGeneralResponseSchema,
  ReportGeneralFiltersSchema,
} from '../schemas/reportGeneral.schema';
import {
  ReportMasVendidoResponseSchema,
  ReportMasVendidoFiltersSchema,
} from '../schemas/reportMasVendido.schema';
import {
  ReportMayorIngresoResponseSchema,
  ReportMayorIngresoFiltersSchema,
} from '../schemas/reportMayorIngreso.schema';
import type {
  ReportGeneralResponse,
  ReportGeneralFilters,
  ReportMasVendidoResponse,
  ReportMasVendidoFilters,
  ReportMayorIngresoResponse,
  ReportMayorIngresoFilters,
} from '../types/report.types';
import { REPORT_ENDPOINTS } from './reportEndpoints';
import type { AxiosRequestConfig } from 'axios';

const MODULE_NAME = 'SALE_REPORT_SERVICE';

/**
 * Crear FormData desde filtros
 */
const createFormData = (filters: Record<string, any>): FormData => {
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
const ExcelRequestConfig =  (timeout?:number): AxiosRequestConfig => {
  return  {
	responseType: 'blob',
	headers: {
	  'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	},
	timeout: timeout || 120000, // 2 minutos por defecto
  };
};

export const reportService = {
  /**
   * Obtener reporte general de ventas
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getGeneral(
    filters: ReportGeneralFilters
  ): Promise<ReportGeneralResponse | Blob> {
    Logger.info('Fetching general report', { filters }, MODULE_NAME);

    const validatedFilters = ReportGeneralFiltersSchema.parse(filters);
    const isDownloadable = validatedFilters.downloadable ?? false;

    const formData = createFormData({
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      sucursal: validatedFilters.sucursal,
      downloadable: isDownloadable,
    });

    if (isDownloadable) {
      const blob = await ApiService.post(
      REPORT_ENDPOINTS.sales.general,
      formData,
      undefined,
      ExcelRequestConfig()
    );
      Logger.info('General report blob fetched successfully', {}, MODULE_NAME);
      return blob as Blob;
    }

    const response = await ApiService.post(
      REPORT_ENDPOINTS.sales.general,
      formData,
      ReportGeneralResponseSchema
    );

    Logger.info(
      'General report fetched successfully',
      { count: response.data.length },
      MODULE_NAME
    );

    return response as ReportGeneralResponse;
  },

  /**
   * Obtener reporte de productos más vendidos
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getMasVendido(
    filters: ReportMasVendidoFilters
  ): Promise<ReportMasVendidoResponse | Blob> {
    Logger.info('Fetching most sold report', { filters }, MODULE_NAME);

    const validatedFilters = ReportMasVendidoFiltersSchema.parse(filters);
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
      REPORT_ENDPOINTS.sales.masVendido,
      formData,
      undefined,
      ExcelRequestConfig()
    );
      Logger.info('Most sold report blob fetched successfully', {}, MODULE_NAME);
      return blob as Blob;
    }

    const response = await ApiService.post(
      REPORT_ENDPOINTS.sales.masVendido,
      formData,
      ReportMasVendidoResponseSchema
    );

    Logger.info(
      'Most sold report fetched successfully',
      { count: response.data.length },
      MODULE_NAME
    );

    return response as ReportMasVendidoResponse;
  },

  /**
   * Obtener reporte de productos con mayor ingreso
   * Si downloadable=true, retorna Blob (Excel)
   * Si downloadable=false, retorna datos JSON
   */
  async getMayorIngreso(
    filters: ReportMayorIngresoFilters
  ): Promise<ReportMayorIngresoResponse | Blob> {
    Logger.info('Fetching top revenue report', { filters }, MODULE_NAME);

    const validatedFilters = ReportMayorIngresoFiltersSchema.parse(filters);
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
      REPORT_ENDPOINTS.sales.mayorIngreso,
      formData,
      undefined,
      ExcelRequestConfig()
    );
      Logger.info('Top revenue report blob fetched successfully', {}, MODULE_NAME);
      return blob as Blob;
    }

    const response = await ApiService.post(
      REPORT_ENDPOINTS.sales.mayorIngreso,
      formData,
      ReportMayorIngresoResponseSchema
    );

    Logger.info(
      'Top revenue report fetched successfully',
      { count: response.data.length },
      MODULE_NAME
    );

    return response as ReportMayorIngresoResponse;
  },
};