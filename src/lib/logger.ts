import { environment } from "@/utils/environment";
import { getLogger } from '@/platform';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    data?: unknown;
    timestamp: string;
    module?: string;
}

export class Logger {
    private static isDevelopment = environment.app_env === 'development';
    private static isProduction = environment.app_env === 'production';

    private static createLogEntry(
        level: LogLevel,
        message: string,
        data?: unknown,
        module?: string
    ): LogEntry {
        return {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            module,
        };
    }

    static info(message: string, data?: unknown, module?: string) {
        const entry = this.createLogEntry('info', message, data, module);
        const formattedMessage = `[INFO${module ? ` ${module}` : ''}] ${message}${data ? ` | ${JSON.stringify(data)}` : ''}`;

        // Siempre loguear a consola
        console.log(formattedMessage, data || '');

        // Escribir al archivo de logs de Tauri usando comando personalizado
        getLogger().write('info', formattedMessage);

        // Enviar a servicio externo solo en producción
        if (this.isProduction) {
            this.sendToLoggingService(entry);
        }
    }

    static error(message: string, error?: unknown, module?: string) {
        const entry = this.createLogEntry('error', message, error, module);
        const formattedMessage = `[ERROR${module ? ` ${module}` : ''}] ${message}${error ? ` | ${JSON.stringify(error)}` : ''}`;

        // Siempre loguear a consola
        console.error(formattedMessage, error || '');

        // Escribir al archivo de logs de Tauri usando comando personalizado
        getLogger().write('error', formattedMessage);

        // Enviar a servicio externo solo en producción
        if (this.isProduction) {
            this.sendToLoggingService(entry);
        }
    }

    static warn(message: string, data?: unknown, module?: string) {
        const entry = this.createLogEntry('warn', message, data, module);
        const formattedMessage = `[WARN${module ? ` ${module}` : ''}] ${message}${data ? ` | ${JSON.stringify(data)}` : ''}`;

        // Siempre loguear a consola
        console.warn(formattedMessage, data || '');

        // Escribir al archivo de logs de Tauri usando comando personalizado
        getLogger().write('warn', formattedMessage);

        // Enviar a servicio externo solo en producción
        if (this.isProduction) {
            this.sendToLoggingService(entry);
        }
    }

    static debug(message: string, data?: unknown, module?: string) {
        const formattedMessage = `[DEBUG${module ? ` ${module}` : ''}] ${message}${data ? ` | ${JSON.stringify(data)}` : ''}`;

        // Siempre loguear a consola en desarrollo
        if (this.isDevelopment) {
            console.debug(formattedMessage, data || '');
            // Escribir al archivo de logs de Tauri usando comando personalizado
            getLogger().write('debug', formattedMessage);
        }

        // Debug logs normalmente no se envían en producción
        // pero puedes cambiar esta lógica según tus necesidades
    }

    private static sendToLoggingService(_entry: LogEntry) {
        // Implementar según tu proveedor de logging
        try {
            // Ejemplo con fetch a tu servicio de logging
            // fetch('/api/logs', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(entry),
            // }).catch(() => {
            //     // Silenciar errores de logging para no afectar UX
            // });

            // O enviar a Sentry:
            // Sentry.addBreadcrumb({
            //   message: entry.message,
            //   level: entry.level,
            //   data: entry.data,
            // });
        } catch {
            // Silenciar errores de logging
        }
    }
}