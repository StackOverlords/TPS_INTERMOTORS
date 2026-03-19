import { ApiService } from '@/lib/apiService';
import { Logger } from '@/lib/logger';
import {
    QuotationReportGeneralFiltersSchema,
    QuotationReportGeneralResponseSchema,
} from '../schemas/reports/quotationReportGeneral.schema';
import {
    QuotationReportConversionFiltersSchema,
    QuotationReportConversionResponseSchema,
} from '../schemas/reports/quotationReportConversion.schema';
import {
    QuotationReportTopClientesFiltersSchema,
    QuotationReportTopClientesResponseSchema,
} from '../schemas/reports/quotationReportTopClientes.schema';
import {
    QuotationReportProductosFiltersSchema,
    QuotationReportProductosResponseSchema,
} from '../schemas/reports/quotationReportProductos.schema';
import {
    QuotationReportAbiertasFiltersSchema,
    QuotationReportAbiertasResponseSchema,
} from '../schemas/reports/quotationReportAbiertas.schema';
import {
    QuotationReportDesempenoFiltersSchema,
    QuotationReportDesempenoResponseSchema,
} from '../schemas/reports/quotationReportDesempeno.schema';
import type {
    QuotationReportGeneralFilters,
    QuotationReportGeneralResponse,
    QuotationReportConversionFilters,
    QuotationReportConversionResponse,
    QuotationReportTopClientesFilters,
    QuotationReportTopClientesResponse,
    QuotationReportProductosFilters,
    QuotationReportProductosResponse,
    QuotationReportAbiertasFilters,
    QuotationReportAbiertasResponse,
    QuotationReportDesempenoFilters,
    QuotationReportDesempenoResponse,
} from '../types/quotationReports.types';
import { QUOTATION_ENDPOINTS } from './quotationEndpoints.service';
import type { AxiosRequestConfig } from 'axios';

const MODULE_NAME = 'QUOTATION_REPORTS_SERVICE';

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
        responseType: 'blob',
        headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        timeout: timeout || 120000, // 2 minutos por defecto
    };
};

export const quotationReportsService = {
    /**
     * Obtener reporte general de cotizaciones
     * Si exportar=true, retorna Blob (Excel)
     * Si exportar=false, retorna datos JSON
     */
    async getGeneral(
        filters: QuotationReportGeneralFilters
    ): Promise<QuotationReportGeneralResponse | Blob> {
        Logger.info('Fetching general quotation report', { filters }, MODULE_NAME);

        const validatedFilters = QuotationReportGeneralFiltersSchema.parse(filters);
        const isExportable = validatedFilters.exportar ?? false;

        const formData = createFormData({
            fecha_inicio: validatedFilters.fecha_inicio,
            fecha_fin: validatedFilters.fecha_fin,
            sucursal: validatedFilters.sucursal,
            exportar: isExportable,
        });

        if (isExportable) {
            const blob = await ApiService.post(
                QUOTATION_ENDPOINTS.reports.general,
                formData,
                undefined,
                ExcelRequestConfig()
            );
            Logger.info('General quotation report blob fetched successfully', {}, MODULE_NAME);
            return blob as Blob;
        }

        const response = await ApiService.post(
            QUOTATION_ENDPOINTS.reports.general,
            formData,
            QuotationReportGeneralResponseSchema
        );

        Logger.info(
            'General quotation report fetched successfully',
            { count: response.data.length },
            MODULE_NAME
        );

        return response as QuotationReportGeneralResponse;
    },

    /**
     * Obtener reporte de conversión de cotizaciones
     */
    async getConversion(
        filters: QuotationReportConversionFilters
    ): Promise<QuotationReportConversionResponse> {
        Logger.info('Fetching conversion quotation report', { filters }, MODULE_NAME);

        const validatedFilters = QuotationReportConversionFiltersSchema.parse(filters);

        const formData = createFormData({
            fecha_inicio: validatedFilters.fecha_inicio,
            fecha_fin: validatedFilters.fecha_fin,
            sucursal: validatedFilters.sucursal,
        });

        const response = await ApiService.post(
            QUOTATION_ENDPOINTS.reports.conversion,
            formData,
            QuotationReportConversionResponseSchema
        );

        Logger.info(
            'Conversion quotation report fetched successfully',
            { count: response.data.length },
            MODULE_NAME
        );

        return response as QuotationReportConversionResponse;
    },

    /**
     * Obtener reporte de top clientes por cotizaciones
     */
    async getTopClientes(
        filters: QuotationReportTopClientesFilters
    ): Promise<QuotationReportTopClientesResponse> {
        Logger.info('Fetching top clientes quotation report', { filters }, MODULE_NAME);

        const validatedFilters = QuotationReportTopClientesFiltersSchema.parse(filters);

        const formData = createFormData({
            fecha_inicio: validatedFilters.fecha_inicio,
            fecha_fin: validatedFilters.fecha_fin,
            sucursal: validatedFilters.sucursal,
            top_n: validatedFilters.top_n,
        });

        const response = await ApiService.post(
            QUOTATION_ENDPOINTS.reports.topClientes,
            formData,
            QuotationReportTopClientesResponseSchema
        );

        Logger.info(
            'Top clientes quotation report fetched successfully',
            { count: response.data.length },
            MODULE_NAME
        );

        return response as QuotationReportTopClientesResponse;
    },

    /**
     * Obtener reporte de productos más cotizados
     */
    async getProductosCotizados(
        filters: QuotationReportProductosFilters
    ): Promise<QuotationReportProductosResponse> {
        Logger.info('Fetching productos cotizados report', { filters }, MODULE_NAME);

        const validatedFilters = QuotationReportProductosFiltersSchema.parse(filters);

        const formData = createFormData({
            fecha_inicio: validatedFilters.fecha_inicio,
            fecha_fin: validatedFilters.fecha_fin,
            sucursal: validatedFilters.sucursal,
            top_n: validatedFilters.top_n,
        });

        const response = await ApiService.post(
            QUOTATION_ENDPOINTS.reports.productosCotizados,
            formData,
            QuotationReportProductosResponseSchema
        );

        Logger.info(
            'Productos cotizados report fetched successfully',
            { count: response.data.length },
            MODULE_NAME
        );

        return response as QuotationReportProductosResponse;
    },

    /**
     * Obtener reporte de cotizaciones abiertas
     */
    async getAbiertas(
        filters: QuotationReportAbiertasFilters
    ): Promise<QuotationReportAbiertasResponse> {
        Logger.info('Fetching abiertas quotation report', { filters }, MODULE_NAME);

        const validatedFilters = QuotationReportAbiertasFiltersSchema.parse(filters);

        const formData = createFormData({
            fecha_inicio: validatedFilters.fecha_inicio,
            fecha_fin: validatedFilters.fecha_fin,
            sucursal: validatedFilters.sucursal,
            dias_minimos: validatedFilters.dias_minimos,
        });

        const response = await ApiService.post(
            QUOTATION_ENDPOINTS.reports.abiertas,
            formData,
            QuotationReportAbiertasResponseSchema
        );

        Logger.info(
            'Abiertas quotation report fetched successfully',
            { count: response.data.length },
            MODULE_NAME
        );

        return response as QuotationReportAbiertasResponse;
    },

    /**
     * Obtener reporte de desempeño por responsable
     */
    async getDesempeno(
        filters: QuotationReportDesempenoFilters
    ): Promise<QuotationReportDesempenoResponse> {
        Logger.info('Fetching desempeno quotation report', { filters }, MODULE_NAME);

        const validatedFilters = QuotationReportDesempenoFiltersSchema.parse(filters);

        const formData = createFormData({
            fecha_inicio: validatedFilters.fecha_inicio,
            fecha_fin: validatedFilters.fecha_fin,
            sucursal: validatedFilters.sucursal,
        });

        const response = await ApiService.post(
            QUOTATION_ENDPOINTS.reports.desempeno,
            formData,
            QuotationReportDesempenoResponseSchema
        );

        Logger.info(
            'Desempeno quotation report fetched successfully',
            { count: response.data.length },
            MODULE_NAME
        );

        return response as QuotationReportDesempenoResponse;
    },
};
