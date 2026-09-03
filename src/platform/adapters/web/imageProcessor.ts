/**
 * Adaptador web del puerto `ImageProcessorPort`.
 *
 * El navegador codifica WebP de forma nativa con `canvas.toDataURL`, así que
 * acá NO se pierde capacidad respecto del codificador Rust. La única opción sin
 * equivalente es `effort`: el navegador no expone el nivel de esfuerzo del
 * codificador y lo ignora.
 */

import type {
  CompressToWebPOptions,
  ImageInfo,
  ImageProcessorPort,
} from '@/platform/ports/imageProcessor';

function loadImage(base64Data: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error('No se pudo decodificar la imagen recibida'));
    img.src = base64Data;
  });
}

/** Bytes reales que representa el payload base64 de una data URL. */
function decodedSizeOf(base64Data: string): number {
  const payload = base64Data.split(',')[1] ?? base64Data;
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

/** Extrae el subtipo MIME del prefijo `data:image/<formato>;base64,`. */
function formatOf(base64Data: string): string {
  return base64Data.match(/^data:image\/([a-z0-9+.-]+)/i)?.[1] ?? 'unknown';
}

export const webImageProcessor: ImageProcessorPort = {
  async getImageInfo(base64Data: string): Promise<ImageInfo> {
    const img = await loadImage(base64Data);
    const format = formatOf(base64Data);

    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      format,
      size: decodedSizeOf(base64Data),
      isWebP: format.toLowerCase() === 'webp',
    };
  },

  async compressToWebP(
    base64Data: string,
    { quality }: CompressToWebPOptions,
  ): Promise<string> {
    const img = await loadImage(base64Data);

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener el contexto 2D del canvas');

    ctx.drawImage(img, 0, 0);

    const encoded = canvas.toDataURL('image/webp', quality);

    // Si el navegador no soporta WebP, `toDataURL` cae silenciosamente a PNG.
    // Preferimos fallar explícito antes que devolver algo que no es lo pedido.
    if (!encoded.startsWith('data:image/webp')) {
      throw new Error('Este navegador no puede codificar WebP');
    }

    return encoded;
  },
};
