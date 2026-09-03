import { getFileSystem } from '@/platform';
import { Logger } from '@/lib/logger';

const MODULE_NAME = 'EXCEL_UTILS';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Genera nombre de archivo con fecha
 */
export const generateExcelFilename = (baseName: string): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${baseName}_${date}.xlsx`;
};

/**
 * Entrega el Excel al usuario.
 *
 * Escritorio: diálogo nativo "Guardar como". Web: descarga del navegador.
 * Retorna `true` si se guardó, `false` si el usuario canceló el diálogo (en web
 * no hay cancelación posible, así que siempre es `true`).
 */
export const saveExcelFile = async (
  blob: Blob,
  filename: string,
): Promise<boolean> => {
  try {
    const saved = await getFileSystem().saveFile({
      suggestedName: filename,
      data: blob,
      mimeType: blob.type || XLSX_MIME,
      extensions: ['xlsx'],
      filterName: 'Excel',
    });

    if (!saved) {
      Logger.info('User cancelled save dialog', {}, MODULE_NAME);
      return false;
    }

    Logger.info('Excel saved successfully', { filename }, MODULE_NAME);
    return true;
  } catch (error) {
    Logger.error('Error saving Excel file', { error, filename }, MODULE_NAME);
    throw error;
  }
};
