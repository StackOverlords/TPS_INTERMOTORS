/**
 * Adaptador web del puerto `ClipboardPort`.
 *
 * Usa la Async Clipboard API. Requiere contexto seguro (HTTPS o localhost) y
 * permiso del usuario; `navigator.clipboard.read` no existe en todos los
 * navegadores, por eso `canReadImage()` lo detecta antes de ofrecer la acción.
 */

import type { ClipboardPort } from '@/platform/ports/clipboard';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export const webClipboard: ClipboardPort = {
  canReadImage() {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.clipboard?.read === 'function'
    );
  },

  async readImage(): Promise<string | null> {
    if (!this.canReadImage()) return null;

    try {
      for (const item of await navigator.clipboard.read()) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (!imageType) continue;
        return await blobToDataUrl(await item.getType(imageType));
      }
    } catch (error) {
      // Permiso denegado, contexto inseguro o portapapeles vacío.
      console.warn('[WebClipboard] No se pudo leer el portapapeles:', error);
    }

    return null;
  },
};
