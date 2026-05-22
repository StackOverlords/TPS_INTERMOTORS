import authSDK from "@/services/sdk-simple-auth";
import { useTabStore } from "@/states/tabStore";

const isSecondaryWindow =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("windowId") !== null;
import { cleanFilters } from "@/utils/cleanFilters";
import { environment } from "@/utils/environment";
import {
  extractRequestContext,
  formatAxiosError,
  formatSuccessResponse,
  generateRequestId,
  shouldLogError,
  shouldLogSuccess,
  type FormattedHttpError,
} from "@/utils/axiosErrorFormatter";
import logger from "@/utils/logger";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

// Extender la configuración de Axios para incluir metadata de tracking
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    requestId?: string;
    startTime?: number;
    _retry?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 segundos
});

// Campos de fecha que deben tener hora fin del día (23:59:59)
const END_OF_DAY_PARAMS = ["fecha_fin"];

/**
 * Si el param es una fecha en formato yyyy-mm-dd y su clave está en END_OF_DAY_PARAMS,
 * le agrega la hora 23:59:59 en formato ISO para que el backend reciba el rango completo.
 */
const applyEndOfDayToParams = (
  params: Record<string, unknown>,
): Record<string, unknown> => {
  const result = { ...params };
  for (const key of END_OF_DAY_PARAMS) {
    const value = result[key];
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Construir fecha local al último momento del día y convertir a ISO
      const [year, month, day] = value.split("-").map(Number);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      result[key] = endOfDay.toISOString();
    }
  }
  return result;
};

// ============================================================================
// REQUEST INTERCEPTOR - Logging y preparación de requests
// ============================================================================
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Generar ID único y timestamp para tracking
    config.requestId = generateRequestId();
    config.startTime = Date.now();

    // Autenticación
    const token = await authSDK.getValidAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Limpiar filtros en GET requests
    if (config.method?.toLowerCase() === "get" && config.params) {
      config.params = cleanFilters(config.params as Record<string, unknown>);
      // Aplicar hora fin del día a los campos de fecha correspondientes
      config.params = applyEndOfDayToParams(
        config.params as Record<string, unknown>,
      );
    }

    // Limpiar null/undefined del body en POST/PUT/PATCH
    // Evita que DTOs del backend fallen al recibir null en campos opcionales
    const method = config.method?.toLowerCase();
    if (
      (method === "post" || method === "put" || method === "patch") &&
      config.data &&
      typeof config.data === "object" &&
      !(config.data instanceof FormData) &&
      !(config.data instanceof Blob)
    ) {
      config.data = cleanFilters(config.data as Record<string, unknown>);
    }

    // Log de request (solo en desarrollo o para debugging)
    if (environment.env === "development") {
      const context = extractRequestContext(config);
      logger.debug(
        `[HTTP REQUEST] ${context.method} ${context.url}`,
        JSON.stringify({
          requestId: context.requestId,
          method: context.method,
          url: context.url,
          params: context.params,
          data: context.data,
        }),
      );
    }

    return config;
  },
  (error) => {
    // Error antes de enviar la request
    logger.error(
      "[HTTP REQUEST ERROR] Failed to configure request",
      JSON.stringify({
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"),
      }),
    );

    return Promise.reject(error);
  },
);

// ============================================================================
// RESPONSE INTERCEPTOR - Logging automático de responses y errores
// ============================================================================
apiClient.interceptors.response.use(
  // Success handler
  (response) => {
    const { requestId, startTime } =
      response.config as InternalAxiosRequestConfig;

    if (requestId && startTime) {
      const formatted = formatSuccessResponse(response, requestId, startTime);

      // Log solo si la request fue lenta
      if (
        shouldLogSuccess(
          formatted,
          environment.env as "development" | "production",
        )
      ) {
        logger.warn(
          `[HTTP SLOW RESPONSE] ${formatted.method} ${formatted.url} took ${formatted.duration}ms`,
          JSON.stringify(formatted),
        );
      }

      // En desarrollo, loguear todo con nivel DEBUG
      if (environment.env === "development") {
        logger.debug(
          `[HTTP SUCCESS] ${formatted.method} ${formatted.url}`,
          JSON.stringify({
            requestId: formatted.requestId,
            status: formatted.status,
            duration: formatted.duration,
            dataSize: formatted.dataSize,
          }),
        );
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
    const formattedError: FormattedHttpError = formatAxiosError(
      error,
      requestId,
      startTime,
    );

    // Determinar si debemos loguear según el tipo de error y entorno
    const shouldLog = shouldLogError(
      formattedError,
      environment.env as "development" | "production",
    );

    if (shouldLog) {
      // Usar nivel apropiado según el tipo de error
      const logLevel =
        formattedError.type === "server" || formattedError.type === "network"
          ? "error"
          : "warn";

      logger[logLevel](
        `[HTTP ${formattedError.type.toUpperCase()} ERROR] ${formattedError.message}`,
        JSON.stringify(formattedError),
      );
    }

    // Manejo de errores de autenticación
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        const hadAuthHeader = !!(error.config?.headers as Record<string, string> | undefined)?.Authorization;
        const alreadyRetried = !!config?._retry;

        logger.warn(
          "[AUTH ERROR] Unauthorized access",
          JSON.stringify({
            requestId,
            status,
            url: formattedError.fullUrl,
            isSecondaryWindow,
            hadAuthHeader,
            alreadyRetried,
          }),
        );

        // Retry once after forcing a token refresh.
        // Covers the race where two parallel requests fire while the SDK mutex
        // holds a refresh — one gets the new token, the other gets the stale one → 401.
        if (hadAuthHeader && !alreadyRetried && config) {
          config._retry = true;
          try {
            const newToken = await authSDK.getValidAccessToken();
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
              return apiClient(config);
            }
          } catch {
            // refresh failed — fall through to clearSession
          }
        }

        if (!isSecondaryWindow && hadAuthHeader) {
          useTabStore.getState().closeAllTabs();
          await authSDK.clearLocalSession();
        }
      }

      // 403 = authenticated but no permission — do NOT logout, let the caller handle the error
      if (status === 403) {
        logger.warn(
          "[AUTH ERROR] Forbidden — insufficient permissions",
          JSON.stringify({
            requestId,
            status,
            url: formattedError.fullUrl,
          }),
        );
      }
    }

    // Manejo de errores de red
    if (error.request && !error.response) {
      const isNetworkError =
        error.message === "Network Error" ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK";

      if (isNetworkError) {
        logger.error(
          "[NETWORK ERROR] Failed to connect to server",
          JSON.stringify({
            requestId,
            message: formattedError.message,
            type: formattedError.type,
            url: formattedError.fullUrl,
          }),
        );
      }
    }

    // Extraer mensaje legible del cuerpo de error del backend
    if (error.response?.data) {
      const humanMessage = extractBackendMessage(error.response.data);
      if (humanMessage) {
        error.message = humanMessage;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Extrae el mensaje más útil de la respuesta de error del backend.
 *
 * Soporta los siguientes formatos:
 *   { error: { message, validation_errors: [{ field, message }] } }
 *   { message: "..." }
 *   [{ message: "..." }]
 */
function extractBackendMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const root = data as Record<string, unknown>;

  // Formato estándar: { error: { ... } }
  const errorObj = root.error as Record<string, unknown> | undefined;
  if (errorObj && typeof errorObj === "object") {
    const validationErrors = errorObj.validation_errors;
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      const messages = validationErrors
        .map((e) => (typeof e === "object" && e !== null ? (e as Record<string, unknown>).message : null))
        .filter(Boolean) as string[];
      if (messages.length > 0) return messages.join(" | ");
    }
    if (typeof errorObj.message === "string") return errorObj.message;
  }

  // Formato plano: { message: "..." }
  if (typeof root.message === "string") return root.message;

  // Formato array: [{ message: "..." }]
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>;
    if (typeof first?.message === "string") return first.message;
  }

  return null;
}

export default apiClient;
