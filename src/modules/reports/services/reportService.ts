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
import apiClient from '@/services/axios';

const MODULE_NAME = 'REPORT_SERVICE';

/**
 * Helper para descargar archivo desde blob
 */
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Generar nombre de archivo con fecha
 */
const generateFilename = (baseFilename: string): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${baseFilename}_${date}.xlsx`;
};

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

export const reportService = {
  /**
   * Obtener reporte general de ventas
   * Si downloadable=true, descarga Excel y retorna void
   * Si downloadable=false, retorna datos JSON
   */
  async getGeneral(
    filters: ReportGeneralFilters
  ): Promise<ReportGeneralResponse | void> {
    Logger.info('Fetching general report', { filters }, MODULE_NAME);

    const validatedFilters = ReportGeneralFiltersSchema.parse(filters);
    const isDownloadable = validatedFilters.downloadable ?? false;

    const formData = createFormData({
      fecha_inicio: validatedFilters.fecha_inicio,
      fecha_fin: validatedFilters.fecha_fin,
      sucursal: validatedFilters.sucursal,
      downloadable: isDownloadable,
    });

    // Si es descarga, usar axios directamente para manejar blob
    if (isDownloadable) {
      try {
        const response = await apiClient.post(
          REPORT_ENDPOINTS.sales.general,
          formData,
          {
            responseType: 'blob',
            headers: {
              'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          }
        );

        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const filename = generateFilename('reporte_general_ventas');
        downloadFile(blob, filename);

        Logger.info('General report downloaded successfully', { filename }, MODULE_NAME);
        return;
      } catch (error) {
        Logger.error('Error downloading general report', error, MODULE_NAME);
        throw error;
      }
    }

    // Si no es descarga, obtener datos JSON
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
   * Si downloadable=true, descarga Excel y retorna void
   * Si downloadable=false, retorna datos JSON
   */
  async getMasVendido(
    filters: ReportMasVendidoFilters
  ): Promise<ReportMasVendidoResponse | void> {
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

    // Si es descarga, usar axios directamente para manejar blob
    if (isDownloadable) {
      try {
        const response = await apiClient.post(
          REPORT_ENDPOINTS.sales.masVendido,
          formData,
          {
            responseType: 'blob',
            headers: {
              'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          }
        );

        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const filename = generateFilename('productos_mas_vendidos');
        downloadFile(blob, filename);

        Logger.info('Most sold report downloaded successfully', { filename }, MODULE_NAME);
        return;
      } catch (error) {
        Logger.error('Error downloading most sold report', error, MODULE_NAME);
        throw error;
      }
    }

    // Si no es descarga, obtener datos JSON
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
   * Si downloadable=true, descarga Excel y retorna void
   * Si downloadable=false, retorna datos JSON
   */
  async getMayorIngreso(
    filters: ReportMayorIngresoFilters
  ): Promise<ReportMayorIngresoResponse | void> {
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

    // Si es descarga, usar axios directamente para manejar blob
    if (isDownloadable) {
      try {
        const response = await apiClient.post(
          REPORT_ENDPOINTS.sales.mayorIngreso,
          formData,
          {
            responseType: 'blob',
            headers: {
              'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          }
        );

        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const filename = generateFilename('productos_mayor_ingreso');
        downloadFile(blob, filename);

        Logger.info('Top revenue report downloaded successfully', { filename }, MODULE_NAME);
        return;
      } catch (error) {
        Logger.error('Error downloading top revenue report', error, MODULE_NAME);
        throw error;
      }
    }

    // Si no es descarga, obtener datos JSON
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