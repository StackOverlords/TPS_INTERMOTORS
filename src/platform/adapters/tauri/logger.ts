/**
 * Adaptador Tauri del puerto `LoggerPort`.
 *
 * Escribe al archivo de log de la app vía `plugin-log`. Ubicación:
 *  - Windows: %APPDATA%\com.intermotors.tps\logs\app.log
 *  - Linux:   ~/.local/share/com.intermotors.tps/logs/app.log
 */

import { debug, error, info, trace, warn } from '@tauri-apps/plugin-log';

import type { LogEntry, LoggerPort, LogLevel } from '@/platform/ports/logger';

const writers: Record<LogLevel, (message: string) => Promise<void>> = {
  trace,
  debug,
  info,
  warn,
  error,
};

export const tauriLogger: LoggerPort = {
  write(level: LogLevel, message: string): void {
    // Fire-and-forget: un fallo al loguear nunca debe afectar la UX.
    writers[level](message).catch(() => {});
  },

  canReadLogs() {
    // La lectura del archivo la maneja hoy DebugLogWindow directamente con
    // plugin-fs. Cuando se migre, la implementación entra acá.
    return false;
  },

  async readRecentLogs(): Promise<LogEntry[]> {
    return [];
  },

  async clearLogs(): Promise<void> {
    // Sin implementar: requiere truncar el archivo desde Rust.
  },
};
