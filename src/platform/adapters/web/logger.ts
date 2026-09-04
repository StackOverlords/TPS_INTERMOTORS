/**
 * Adaptador web del puerto `LoggerPort`.
 *
 * El navegador no da acceso al disco: el destino es la consola de DevTools.
 *
 * Los consumidores (`utils/logger.ts`, `lib/logger.ts`) NO escriben a consola
 * por su cuenta en todos los niveles, así que acá sí lo hacemos —a diferencia
 * del adaptador de escritorio, donde el archivo es el destino real.
 *
 * Para diagnóstico de producción en web, el destino correcto es un endpoint del
 * backend; hoy no existe y no se inventa uno acá.
 */

import type { LoggerPort, LogLevel } from '@/platform/ports/logger';

/**
 * Nivel del puerto → método de consola.
 *
 * `trace` va a `console.debug` a propósito: `console.trace` imprime el stack
 * completo en cada línea y vuelve ilegible el panel.
 */
const CONSOLE_METHOD: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
  trace: 'debug',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

export const webLogger: LoggerPort = {
  write(level: LogLevel, message: string): void {
    // Se resuelve el método EN CADA ESCRITURA, no al cargar el módulo. Guardar
    // la referencia de entrada deja al logger inmune a cualquier parche
    // posterior de `console` (una herramienta de monitoreo, por ejemplo).
    console[CONSOLE_METHOD[level]](`[${level.toUpperCase()}] ${message}`);
  },
};
