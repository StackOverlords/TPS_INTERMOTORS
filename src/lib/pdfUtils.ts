import { isTauriEnvironment } from "@/utils/environment";
import { Logger } from "./logger";

const MODULE_NAME = 'PDF_UTILS';

/**
 * Crea una URL de objeto desde un Blob
 */
export const createObjectURL = (blob: Blob): string => {
    return URL.createObjectURL(blob);
};

/**
 * Libera una URL de objeto
 */
export const revokeObjectURL = (url: string): void => {
    URL.revokeObjectURL(url);
};

/**
 * Descarga un PDF
 * @param blob - Blob del PDF
 * @param filename - Nombre del archivo
 */
export const downloadPDF = async (blob: Blob, filename: string): Promise<string | null> => {
    try {
        if (isTauriEnvironment()) {
            // En Tauri: Usar diálogo nativo de guardado
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');

            const { downloadDir } = await import('@tauri-apps/api/path');
            const dir = await downloadDir();
            const sep = dir.endsWith('/') || dir.endsWith('\\') ? '' : '/';

            const filePath = await save({
                defaultPath: `${dir}${sep}${filename}`,
                filters: [{ name: 'PDF', extensions: ['pdf'] }]
            });

            if (!filePath) {
                Logger.info('User cancelled save dialog', {}, MODULE_NAME);
                return null;
            }

            const arrayBuffer = await blob.arrayBuffer();
            await writeFile(filePath, new Uint8Array(arrayBuffer));
            Logger.info('PDF saved successfully', { path: filePath }, MODULE_NAME);
            return filePath;
        } else {
            // En navegador: Descarga automática
            const url = createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            revokeObjectURL(url);

            Logger.info('PDF downloaded successfully', { filename }, MODULE_NAME);
            return filename;
        }
    } catch (error) {
        Logger.error('Error downloading PDF', { error, filename }, MODULE_NAME);
        throw error;
    }
};

/**
 * Imprime un PDF en el navegador
 * @param blob - Blob del PDF
 */
export const printPDFInBrowser = (blob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const url = createObjectURL(blob);
            const iframe = document.createElement('iframe');
            
            // Ocultar el iframe (pero mantenerlo en el DOM)
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            
            // Añadir al DOM primero
            document.body.appendChild(iframe);
            
            iframe.onload = () => {
                try {
                    // Pequeño delay para asegurar que el PDF está completamente cargado
                    setTimeout(() => {
                        if (iframe.contentWindow) {
                            iframe.contentWindow.print();
                            
                            Logger.info('PDF print dialog opened (browser)', {}, MODULE_NAME);
                            
                            // Cleanup después de un delay
                            setTimeout(() => {
                                if (document.body.contains(iframe)) {
                                    document.body.removeChild(iframe);
                                }
                                revokeObjectURL(url);
                                resolve();
                            }, 1000);
                        } else {
                            throw new Error('Could not access iframe content window');
                        }
                    }, 100);
                } catch (error) {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                    revokeObjectURL(url);
                    reject(error);
                }
            };
            
            iframe.onerror = () => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                revokeObjectURL(url);
                reject(new Error('Failed to load PDF in iframe'));
            };
            
            // Establecer src después de configurar los event handlers
            iframe.src = url;
            
        } catch (error) {
            Logger.error('Error printing PDF in browser', { error }, MODULE_NAME);
            reject(error);
        }
    });
};

/**
 * Abre un PDF en Tauri (para que el usuario pueda imprimirlo)
 * @param blob - Blob del PDF
 */
export const printPDFInTauri = async (blob: Blob): Promise<void> => {
    try {
        if (!isTauriEnvironment()) {
            throw new Error('Not in Tauri environment');
        }

        Logger.info('Starting PDF open process in Tauri', {}, MODULE_NAME);

        // Importar APIs de Tauri
        const { BaseDirectory, writeFile } = await import('@tauri-apps/plugin-fs');
        const { open } = await import('@tauri-apps/plugin-shell');
        const { tempDir } = await import('@tauri-apps/api/path');

        // Convertir blob a ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Crear nombre de archivo temporal único
        const timestamp = Date.now();
        const tempFileName = `cotizacion_temp_${timestamp}.pdf`;
        
        // Guardar en directorio temporal del sistema
        await writeFile(tempFileName, uint8Array, {
            baseDir: BaseDirectory.Temp
        });

        Logger.info('PDF saved to temp directory', { fileName: tempFileName }, MODULE_NAME);

        // Obtener la ruta completa del archivo temporal
        const tempDirPath = await tempDir();
        const separator = tempDirPath.endsWith('/') || tempDirPath.endsWith('\\') ? '' : '/';
        const fullPath = `${tempDirPath}${separator}${tempFileName}`;

        Logger.info('Opening PDF', { path: fullPath }, MODULE_NAME);

        // Abrir con el visor predeterminado del sistema
        await open(fullPath);

        Logger.info('PDF opened successfully in Tauri', {}, MODULE_NAME);

        // Nota: No eliminamos el archivo inmediatamente porque el visor necesita tiempo
        // para abrirlo. Podrías implementar un cleanup después de unos minutos si lo deseas.
        
    } catch (error) {
        Logger.error('Error opening PDF in Tauri', { 
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
        }, MODULE_NAME);
        throw error;
    }
};

/**
 * Imprime un PDF detectando automáticamente el entorno
 * @param blob - Blob del PDF
 */
export const printPDF = async (blob: Blob): Promise<void> => {
    if (isTauriEnvironment()) {
        await printPDFInTauri(blob);
    } else {
        await printPDFInBrowser(blob);
    }
};