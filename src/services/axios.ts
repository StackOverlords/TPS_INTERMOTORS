import authSDK from "@/services/sdk-simple-auth";
import { useTabStore } from "@/states/tabStore";
import { cleanFilters } from "@/utils/cleanFilters";
import { environment } from "@/utils/environment";
import {
  extractRequestContext,
  formatAxiosError,
  formatSuccessResponse,
  generateRequestId,
  shouldLogError,
  shouldLogSuccess,
  type FormattedHttpError
} from "@/utils/axiosErrorFormatter";
import logger from "@/utils/logger";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

// Extender la configuración de Axios para incluir metadata de tracking
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    requestId?: string;
    startTime?: number;
  }
}

const apiClient = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 segundos
});

// ============================================================================
// REQUEST INTERCEPTOR - Logging y preparación de requests
// ============================================================================
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Generar ID único y timestamp para tracking
    config.requestId = generateRequestId();
    config.startTime = Date.now();

    // Autenticación
    const token = await authSDK.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Limpiar filtros en GET requests
    if (config.method?.toLowerCase() === "get" && config.params) {
      config.params = cleanFilters(config.params as Record<string, unknown>);
    }

    // Log de request (solo en desarrollo o para debugging)
    if (environment.env === 'development') {
      const context = extractRequestContext(config);
      logger.debug(`[HTTP REQUEST] ${context.method} ${context.url}`, JSON.stringify({
        requestId: context.requestId,
        method: context.method,
        url: context.url,
        params: context.params,
        data: context.data,
      }));
    }

    return config;
  },
  (error) => {
    // Error antes de enviar la request
    logger.error('[HTTP REQUEST ERROR] Failed to configure request', JSON.stringify({
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    }));

    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR - Logging automático de responses y errores
// ============================================================================
apiClient.interceptors.response.use(
  // Success handler
  (response) => {
    const { requestId, startTime } = response.config as InternalAxiosRequestConfig;

    if (requestId && startTime) {
      const formatted = formatSuccessResponse(response, requestId, startTime);

      // Log solo si la request fue lenta
      if (shouldLogSuccess(formatted, environment.env as 'development' | 'production')) {
        logger.warn(`[HTTP SLOW RESPONSE] ${formatted.method} ${formatted.url} took ${formatted.duration}ms`, JSON.stringify(formatted));
      }

      // En desarrollo, loguear todo con nivel DEBUG
      if (environment.env === 'development') {
        logger.debug(`[HTTP SUCCESS] ${formatted.method} ${formatted.url}`, JSON.stringify({
          requestId: formatted.requestId,
          status: formatted.status,
          duration: formatted.duration,
          dataSize: formatted.dataSize,
        }));
      }
    }

    return response;
  },

  // Error handler
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const requestId = config?.requestId;
    const startTime = config?.startTime;

    // Formatear error para logging
    const formattedError: FormattedHttpError = formatAxiosError(error, requestId, startTime);

    // Determinar si debemos loguear según el tipo de error y entorno
    const shouldLog = shouldLogError(formattedError, environment.env as 'development' | 'production');

    if (shouldLog) {
      // Usar nivel apropiado según el tipo de error
      const logLevel = formattedError.type === 'server' || formattedError.type === 'network'
        ? 'error'
        : 'warn';

      logger[logLevel](
        `[HTTP ${formattedError.type.toUpperCase()} ERROR] ${formattedError.message}`,
        JSON.stringify(formattedError)
      );
    }

    // Manejo de errores de autenticación
    if (error.response) {
      const status = error.response.status;

      if (status === 401 || status === 403) {
        logger.warn('[AUTH ERROR] Unauthorized access, clearing session', JSON.stringify({
          requestId,
          status,
          url: formattedError.fullUrl,
        }));

        // Limpiar todas las tabs
        useTabStore.getState().closeAllTabs();
        await authSDK.clearLocalSession();
      }
    }

    // Manejo de errores de red
    if (error.request && !error.response) {
      const isNetworkError = error.message === "Network Error" ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK";

      if (isNetworkError) {
        logger.error('[NETWORK ERROR] Failed to connect to server', JSON.stringify({
          requestId,
          message: formattedError.message,
          type: formattedError.type,
          url: formattedError.fullUrl,
        }));

        // Descomentar si quieres auto-logout en network errors
        // await authSDK.logout();
        // window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;