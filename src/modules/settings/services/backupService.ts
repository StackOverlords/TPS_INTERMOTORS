import { apiConstructor } from '@/modules/categories/services/api';

export interface BackupSettings {
    cron_expression: string;
    retention_days: number;
}

export interface UpdateBackupSettings {
    cron: string;
    dias_retencion: number;
}

/**
 * Obtiene la configuración actual de backups automáticos
 */
export const getBackupSettings = async (): Promise<BackupSettings> => {
    return await apiConstructor({
        url: '/system/settings/backup',
        method: 'GET'
    });
};

/**
 * Actualiza la configuración de backups automáticos
 * @param cron - Expresión cron válida (ej: "0 4 * * *" para diario a las 4 AM)
 * @param dias_retencion - Días de retención (1-365)
 */
export const updateBackupSettings = async (
    cron: string,
    dias_retencion: number
): Promise<{ message: string }> => {
    return await apiConstructor({
        url: '/system/settings/backup',
        method: 'POST',
        data: {
            cron,
            dias_retencion
        }
    });
};
