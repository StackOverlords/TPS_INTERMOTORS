import { info, error, warn, debug, trace } from '@tauri-apps/plugin-log';

/**
 * Sistema de logging unificado que funciona tanto en desarrollo como en producción
 *
 * En desarrollo: Usa console.* (visible en DevTools)
 * En producción: Guarda en archivo + console.* (visible en el Panel de Debug)
 *
 * Ubicación de logs:
 * - Windows: C:\Users\{username}\AppData\Roaming\com.intermotors.tps\logs\app.log
 * - Linux: ~/.local/share/com.intermotors.tps/logs/app.log
 *
 * Acceso al panel de debug: Ctrl+Shift+D o F12
 */

const isDev = import.meta.env.DEV;

// Helper para formatear argumentos
const formatArgs = (...args: unknown[]): string => {
  return args
    .map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    })
    .join(' ');
};

export const logger = {
  /**
   * Log de información general
   */
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${message}`, ...args);
    const formattedArgs = args.length > 0 ? ` ${formatArgs(...args)}` : '';
    info(`${message}${formattedArgs}`);
  },

  /**
   * Log de errores
   */
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
    const formattedArgs = args.length > 0 ? ` ${formatArgs(...args)}` : '';
    error(`${message}${formattedArgs}`);
  },

  /**
   * Log de advertencias
   */
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
    const formattedArgs = args.length > 0 ? ` ${formatArgs(...args)}` : '';
    warn(`${message}${formattedArgs}`);
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message: string, ...args: unknown[]) => {
    console.debug(`[DEBUG] ${message}`, ...args);
    const formattedArgs = args.length > 0 ? ` ${formatArgs(...args)}` : '';
    debug(`${message}${formattedArgs}`);
  },

  /**
   * Log de trace (detalles muy granulares)
   */
  trace: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.trace(`[TRACE] ${message}`, ...args);
    }
    const formattedArgs = args.length > 0 ? ` ${formatArgs(...args)}` : '';
    trace(`${message}${formattedArgs}`);
  },
};

// Error boundary helper
export const logError = (error: Error, context?: string) => {
  const errorMessage = context
    ? `[${context}] ${error.message}`
    : error.message;

  logger.error(errorMessage, {
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

// Performance logging
export const logPerformance = (label: string, duration: number) => {
  logger.info(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
};

export default logger;
