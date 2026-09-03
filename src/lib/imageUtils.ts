import { getFileSystem } from "@/platform";
import { Logger } from "./logger";

const MODULE_NAME = 'IMAGE_UTILS';

/** Deriva el MIME y la extensión desde el prefijo de una data URL. */
const parseDataUrl = (dataUrl: string): { mimeType: string; extension: string } => {
    if (dataUrl.startsWith('data:image/jpeg')) return { mimeType: 'image/jpeg', extension: 'jpg' };
    if (dataUrl.startsWith('data:image/webp')) return { mimeType: 'image/webp', extension: 'webp' };
    return { mimeType: 'image/png', extension: 'png' };
};

/** Convierte el payload base64 de una data URL a bytes. */
const dataUrlToBytes = (dataUrl: string): Uint8Array => {
    const base64Data = dataUrl.split(',')[1] ?? '';
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

/**
 * Entrega una imagen al usuario como archivo.
 *
 * Antes exigía estar en Tauri y lanzaba en el navegador; ahora el puerto de
 * archivos resuelve los dos targets (diálogo nativo o descarga del navegador).
 *
 * @param dataUrl - Data URL de la imagen (base64)
 * @param defaultFilename - Nombre por defecto del archivo
 */
export const downloadImage = async (dataUrl: string, defaultFilename: string = 'imagen.png'): Promise<void> => {
    try {
        Logger.info('Starting image download', { defaultFilename }, MODULE_NAME);

        const { mimeType, extension } = parseDataUrl(dataUrl);

        const saved = await getFileSystem().saveFile({
            suggestedName: defaultFilename,
            data: dataUrlToBytes(dataUrl),
            mimeType,
            extensions: [extension, 'png', 'jpg', 'jpeg', 'webp'],
            filterName: 'Imagen',
        });

        if (!saved) {
            Logger.info('User cancelled save dialog', {}, MODULE_NAME);
            return;
        }

        Logger.info('Image saved successfully', { defaultFilename }, MODULE_NAME);
    } catch (error) {
        Logger.error('Error downloading image', { error, defaultFilename }, MODULE_NAME);
        throw error;
    }
};
