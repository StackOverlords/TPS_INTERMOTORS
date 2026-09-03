/**
 * Adaptador Tauri del puerto `WindowChromePort`.
 *
 * Opera sobre la ventana que ejecuta este código, sea la principal o una
 * secundaria: `getCurrentWindow()` resuelve la correcta en cada contexto.
 */

import { getCurrentWindow } from '@tauri-apps/api/window';

import type { WindowChromePort } from '@/platform/ports/windowChrome';

export const tauriWindowChrome: WindowChromePort = {
  hasCustomChrome() {
    return true;
  },

  async minimize() {
    await getCurrentWindow().minimize();
  },

  async toggleMaximize() {
    await getCurrentWindow().toggleMaximize();
  },

  async close() {
    await getCurrentWindow().close();
  },

  async isMaximized() {
    return getCurrentWindow().isMaximized();
  },

  async onMaximizeChange(handler: (maximized: boolean) => void) {
    // Tauri no emite un evento propio de maximizado: se deriva del resize.
    return getCurrentWindow().onResized(async () => {
      try {
        handler(await getCurrentWindow().isMaximized());
      } catch {
        // La ventana puede estar cerrándose; no hay nada que reportar.
      }
    });
  },

  async startDragging() {
    await getCurrentWindow().startDragging();
  },

  async setZoom(level: number) {
    await getCurrentWindow().setZoom(level);
  },
};
