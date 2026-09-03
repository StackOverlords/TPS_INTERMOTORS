/**
 * Adaptador Tauri del puerto `LoggerPort`.
 *
 * Escribe y lee el archivo de log de la app. Ubicación:
 *  - Windows: %APPDATA%\com.intermotors.tps\logs\app.log
 *  - Linux:   ~/.local/share/com.intermotors.tps/logs/app.log
 */

import { appLogDir } from '@tauri-apps/api/path';
import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { debug, error, info, trace, warn } from '@tauri-apps/plugin-log';

import type { LoggerPort, LogLevel } from '@/platform/ports/logger';

const LOG_FILE = 'app.log';

const writers: Record<LogLevel, (message: string) => Promise<void>> = {
  trace,
  debug,
  info,
  warn,
  error,
};

/** El archivo no existe hasta que se escribe el primer log. */
function isFileNotFound(error: unknown): boolean {
  const message = String(error);
  return (
    message.includes('No existe el fichero') ||
    message.includes('No such file') ||
    message.includes('os error 2')
  );
}

export const tauriLogger: LoggerPort = {
  write(level: LogLevel, message: string): void {
    // Fire-and-forget: un fallo al loguear nunca debe afectar la UX.
    writers[level](message).catch(() => {});
  },

  canReadLogs() {
    return true;
  },

  async readLogText(): Promise<string> {
    try {
      return await readTextFile(LOG_FILE, { baseDir: BaseDirectory.AppLog });
    } catch (err) {
      if (isFileNotFound(err)) return '';
      throw err;
    }
  },

  async getLogLocation(): Promise<string | null> {
    try {
      const dir = await appLogDir();
      const sep = dir.endsWith('/') || dir.endsWith('\\') ? '' : '/';
      return `${dir}${sep}${LOG_FILE}`;
    } catch {
      return null;
    }
  },

  async clearLogs(): Promise<void> {
    await writeTextFile(LOG_FILE, '', { baseDir: BaseDirectory.AppLog });
  },
};
