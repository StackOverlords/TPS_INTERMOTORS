import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Logger } from '@/lib/logger';

const MODULE_NAME = 'EXCEL_UTILS';

/**
 * Genera nombre de archivo con fecha
 */
export const generateExcelFilename = (baseName: string): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${baseName}_${date}.xlsx`;
};

/**
 * Abre diálogo nativo de guardado y escribe el archivo Excel.
 * Retorna true si se guardó correctamente, false si el usuario canceló.
 */
export const saveExcelFile = async (blob: Blob, filename: string): Promise<boolean> => {
  try {
    const filePath = await save({
      defaultPath: filename,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });

    // Usuario canceló el diálogo
    if (!filePath) {
      Logger.info('User cancelled save dialog', {}, MODULE_NAME);
      return false;
    }

    const arrayBuffer = await blob.arrayBuffer();
    await writeFile(filePath, new Uint8Array(arrayBuffer));

    Logger.info('Excel saved successfully', { path: filePath }, MODULE_NAME);
    return true;
  } catch (error) {
    Logger.error('Error saving Excel file', { error, filename }, MODULE_NAME);
    throw error;
  }
};