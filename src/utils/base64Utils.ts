/**
 * Convierte una cadena base64 (data URL) a un objeto Blob
 * Compatible con Tauri - no usa fetch
 * @param base64Data - Data URL (ej: "data:image/webp;base64,ABC123...")
 * @returns Blob con los datos de la imagen
 */
export function base64ToBlob(base64Data: string): Blob {
    // Extraer el tipo MIME y los datos base64
    const parts = base64Data.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
    const base64 = parts[1];
    
    // Decodificar base64 a binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: mime });
}

/**
 * Convierte una cadena base64 a un objeto File
 * @param base64Data - Data URL
 * @param fileName - Nombre del archivo
 * @returns File object
 */
export function base64ToFile(base64Data: string, fileName: string): File {
    const blob = base64ToBlob(base64Data);
    return new File([blob], fileName, { type: blob.type });
}