/**
 * Puerto: inspección y compresión de imágenes.
 *
 * En escritorio lo resuelve Rust (`libwebp-sys`, comandos `get_image_info` y
 * `compress_image_to_webp` en `src-tauri/src/commands/image.rs`).
 *
 * En web lo resuelve el propio navegador: `canvas.toDataURL('image/webp', q)`
 * codifica WebP de forma nativa desde hace años. Es una de las pocas piezas de
 * Rust del proyecto que el navegador reemplaza sin perder capacidad.
 */

export interface ImageInfo {
  width: number;
  height: number;
  /** Formato detectado: 'webp', 'png', 'jpeg', … */
  format: string;
  /** Tamaño en bytes de los datos decodificados. */
  size: number;
  isWebP: boolean;
}

export interface CompressToWebPOptions {
  /** Calidad 0-1. */
  quality: number;
  /**
   * Esfuerzo de compresión 0-6. Solo lo usa el codificador de Rust; el
   * navegador no expone un equivalente y lo ignora.
   */
  effort?: number;
}

export interface ImageProcessorPort {
  /** Metadatos de una imagen en data URL base64. */
  getImageInfo(base64Data: string): Promise<ImageInfo>;

  /** Recodifica a WebP. Devuelve una data URL base64. */
  compressToWebP(
    base64Data: string,
    options: CompressToWebPOptions,
  ): Promise<string>;
}
