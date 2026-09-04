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

const writers: Record<LogLevel, (...args: unknown[]) => void> = {
  trace: console.debug,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

export const webLogger: LoggerPort = {
  write(level: LogLevel, message: string): void {
    writers[level](`[${level.toUpperCase()}] ${message}`);
  },
};
