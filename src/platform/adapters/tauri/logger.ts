/**
 * Adaptador Tauri del puerto `LoggerPort`.
 *
 * Escribe al archivo de log de la app:
 *  - Windows: %APPDATA%\com.intermotors.tps\logs\app.log
 *  - Linux:   ~/.local/share/com.intermotors.tps/logs/app.log
 */

import { debug, error, info, trace, warn } from '@tauri-apps/plugin-log';

import type { LoggerPort, LogLevel } from '@/platform/ports/logger';

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
};
