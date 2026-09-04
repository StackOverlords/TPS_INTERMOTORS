/**
 * Adaptador Tauri del puerto `ClipboardPort`.
 *
 * Delega en el comando Rust `read_clipboard_image`
 * (`src-tauri/src/commands/clipboard.rs`, crate `arboard`).
 */

import { invoke } from '@tauri-apps/api/core';

import type { ClipboardPort } from '@/platform/ports/clipboard';

export const tauriClipboard: ClipboardPort = {
  canReadImage() {
    return true;
  },

  async readImage(): Promise<string | null> {
    try {
      const base64 = await invoke<string>('read_clipboard_image');

      // El comando Rust devuelve base64 CRUDO (PNG, sin prefijo). El contrato
      // del puerto es una data URL, así que normalizamos acá: los consumidores
      // reciben exactamente lo mismo en los dos targets.
      return base64.startsWith('data:')
        ? base64
        : `data:image/png;base64,${base64}`;
    } catch {
      // El comando lanza cuando el portapapeles no tiene una imagen.
      return null;
    }
  },
};
