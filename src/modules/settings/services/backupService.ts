import { apiConstructor } from '@/modules/categories/services/api';

export interface BackupSettings {
    cron_expression: string;
    retention_days: number;
}

export interface UpdateBackupSettings {
    cron: string;
    dias_retencion: number;
}

export interface BackupFile {
    nombre: string;
    tamanio_bytes: number;
    tamanio: string;
    fecha_creacion: string;
}

export interface BackupFilesResponse {
    data: BackupFile[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export const getBackupSettings = async (): Promise<BackupSettings> => {
    return await apiConstructor({
        url: '/system/settings/backup',
        method: 'GET'
    });
};

export const updateBackupSettings = async (
    cron: string,
    dias_retencion: number
): Promise<{ message: string }> => {
    return await apiConstructor({
        url: '/system/settings/backup',
        method: 'POST',
        data: { cron, dias_retencion }
    });
};

export const runBackup = async (): Promise<{ message: string }> => {
    return await apiConstructor({
        url: '/system/settings/backup/run',
        method: 'POST'
    });
};

export const fetchBackups = async (
    pagina: number = 1,
    pagina_registros: number = 20
): Promise<BackupFilesResponse> => {
    return await apiConstructor({
        url: '/system/settings/backup/files',
        method: 'GET',
        params: { pagina, pagina_registros }
    });
};
