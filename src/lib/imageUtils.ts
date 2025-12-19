import { Logger } from "./logger";
import { isTauriEnvironment } from "@/utils/environment";

const MODULE_NAME = 'IMAGE_UTILS';

/**
 * Descarga una imagen con diálogo nativo
 * @param dataUrl - Data URL de la imagen (base64)
 * @param defaultFilename - Nombre por defecto del archivo
 */
export const downloadImage = async (dataUrl: string, defaultFilename: string = 'imagen.png'): Promise<void> => {
    try {
        if (!isTauriEnvironment()) {
            throw new Error('Not in Tauri environment');
        }

        Logger.info('Starting image download in Tauri', { defaultFilename }, MODULE_NAME);

        // Importar APIs de Tauri
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');

        // Determinar extensión del archivo
        const extension = dataUrl.startsWith('data:image/png') ? 'png' : 
                         dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 
                         dataUrl.startsWith('data:image/webp') ? 'webp' : 'png';

        // Abrir diálogo de guardado
        const filePath = await save({
            defaultPath: defaultFilename,
            filters: [
                { 
                    name: 'Imagen', 
                    extensions: [extension, 'png', 'jpg', 'jpeg', 'webp'] 
                }
            ]
        });

        if (!filePath) {
            Logger.info('User cancelled save dialog', {}, MODULE_NAME);
            return;
        }

        // Convertir data URL a Uint8Array
        const base64Data = dataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Guardar archivo
        await writeFile(filePath, bytes);
        
        Logger.info('Image saved successfully', { path: filePath }, MODULE_NAME);
    } catch (error) {
        Logger.error('Error downloading image', { error, defaultFilename }, MODULE_NAME);
        throw error;
    }
};