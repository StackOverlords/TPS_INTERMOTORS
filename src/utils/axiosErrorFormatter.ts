import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Información de contexto de una petición HTTP
 */
export interface RequestContext {
  requestId: string;
  method: string;
  url: string;
  baseURL?: string;
  params?: any;
  data?: any;
  headers?: Record<string, string>;
  timestamp: string;
}

/**
 * Información formateada de un error HTTP
 */
export interface FormattedHttpError {
  requestId: string;
  type: 'network' | 'timeout' | 'server' | 'client' | 'unknown';
  message: string;
  status?: number;
  statusText?: string;
  method: string;
  url: string;
  fullUrl: string;
  requestData?: any;
  responseData?: any;
  errorDetails?: any;
  timestamp: string;
  duration?: number;
}

/**
 * Genera un ID único para cada request
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitiza headers removiendo información sensible
 */
function sanitizeHeaders(headers: any): Record<string, string> {
  if (!headers) return {};

  const sanitized: Record<string, string> = {};
  const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'api-key'];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.includes(lowerKey)) {
      sanitized[key] = '***REDACTED***';
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

/**
 * Sanitiza data removiendo información sensible
 */
function sanitizeData(data: any): any {
  if (!data) return data;

  // Si es un string, intentar parsear como JSON
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return data;
    }
  }

  // Si no es un objeto, retornar tal cual
  if (typeof data !== 'object') return data;

  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'apiKey', 'accessToken', 'refreshToken'];
  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Extrae contexto de una request para logging
 */
export function extractRequestContext(config: AxiosRequestConfig & { requestId?: string }): RequestContext {
  const url = config.url || '';
  const baseURL = config.baseURL || '';
  const fullUrl = baseURL ? `${baseURL}${url}` : url;

  return {
    requestId: config.requestId || generateRequestId(),
    method: (config.method || 'GET').toUpperCase(),
    url,
    baseURL,
    params: config.params,
    data: sanitizeData(config.data),
    headers: sanitizeHeaders(config.headers),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formatea un error de Axios en un objeto estructurado para logging
 */
export function formatAxiosError(error: AxiosError, requestId?: string, startTime?: number): FormattedHttpError {
  const config = error.config!;
  const response = error.response;
  const request = error.request;

  const url = config?.url || 'unknown';
  const baseURL = config?.baseURL || '';
  const fullUrl = baseURL ? `${baseURL}${url}` : url;
  const method = (config?.method || 'GET').toUpperCase();

  // Calcular duración si tenemos startTime
  const duration = startTime ? Date.now() - startTime : undefined;

  // Determinar tipo de error
  let type: FormattedHttpError['type'] = 'unknown';
  let message = error.message;

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    type = 'timeout';
    message = `Request timeout after ${config?.timeout || 30000}ms`;
  } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    type = 'network';
    message = 'Network error - No se pudo conectar al servidor';
  } else if (response) {
    const status = response.status;
    if (status >= 400 && status < 500) {
      type = 'client';
      message = `Client error ${status}: ${response.statusText}`;
    } else if (status >= 500) {
      type = 'server';
      message = `Server error ${status}: ${response.statusText}`;
    }
  } else if (request) {
    type = 'network';
    message = 'No response received from server';
  }

  const formatted: FormattedHttpError = {
    requestId: requestId || generateRequestId(),
    type,
    message,
    method,
    url,
    fullUrl,
    timestamp: new Date().toISOString(),
    duration,
  };

  // Agregar información de response si existe
  if (response) {
    formatted.status = response.status;
    formatted.statusText = response.statusText;
    formatted.responseData = sanitizeData(response.data);
  }

  // Agregar información de request
  if (config) {
    formatted.requestData = sanitizeData(config.data);
  }

  // Agregar detalles adicionales del error
  formatted.errorDetails = {
    code: error.code,
    name: error.name,
    stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Solo primeras 5 líneas del stack
  };

  return formatted;
}

/**
 * Formatea una response exitosa para logging
 */
export function formatSuccessResponse(
  response: AxiosResponse,
  requestId: string,
  startTime: number
): {
  requestId: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  duration: number;
  timestamp: string;
  dataSize?: number;
} {
  const config = response.config;
  const url = config.url || 'unknown';
  const baseURL = config.baseURL || '';
  const fullUrl = baseURL ? `${baseURL}${url}` : url;

  // Calcular tamaño aproximado de la respuesta
  let dataSize: number | undefined;
  try {
    dataSize = JSON.stringify(response.data).length;
  } catch {
    // Si no se puede serializar, ignorar
  }

  return {
    requestId,
    method: (config.method || 'GET').toUpperCase(),
    url: fullUrl,
    status: response.status,
    statusText: response.statusText,
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    dataSize,
  };
}

/**
 * Determina si un error debe ser loggeado basado en su tipo
 */
export function shouldLogError(error: FormattedHttpError, environment: 'development' | 'production'): boolean {
  // En desarrollo, loguear todo
  if (environment === 'development') return true;

  // En producción, solo loguear errores de servidor y network
  return error.type === 'server' || error.type === 'network' || error.type === 'timeout';
}

/**
 * Determina si una request exitosa debe ser loggeada
 */
export function shouldLogSuccess(
  response: { status: number; duration: number },
  environment: 'development' | 'production'
): boolean {
  // En desarrollo, loguear todas las requests lentas (>2s)
  if (environment === 'development') {
    return response.duration > 2000;
  }

  // En producción, solo loguear requests muy lentas (>5s)
  return response.duration > 5000;
}
