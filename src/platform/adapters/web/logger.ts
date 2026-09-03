/**
 * Adaptador web del puerto `LoggerPort`.
 *
 * El navegador no da acceso al disco, así que el "archivo de log" es un buffer
 * circular en memoria: sirve para el Panel de Debug dentro de la sesión y se
 * pierde al recargar.
 *
 * Deliberadamente NO escribe a `console.*`: los consumidores (`utils/logger.ts`,
 * `lib/logger.ts`) ya lo hacen por su cuenta, y duplicarlo ensuciaría DevTools.
 *
 * Para diagnóstico real en producción web, el destino correcto es un endpoint
 * del backend, no este buffer.
 */

import type { LogEntry, LoggerPort, LogLevel } from '@/platform/ports/logger';

/** Tope del buffer. Suficiente para diagnosticar sin comerse la memoria. */
const MAX_ENTRIES = 2000;

const buffer: LogEntry[] = [];

export const webLogger: LoggerPort = {
  write(level: LogLevel, message: string): void {
    buffer.push({ level, message, timestamp: new Date().toISOString() });
    if (buffer.length > MAX_ENTRIES) {
      buffer.splice(0, buffer.length - MAX_ENTRIES);
    }
  },

  canReadLogs() {
    return true;
  },

  async readRecentLogs(): Promise<LogEntry[]> {
    return [...buffer];
  },

  async clearLogs(): Promise<void> {
    buffer.length = 0;
  },
};
