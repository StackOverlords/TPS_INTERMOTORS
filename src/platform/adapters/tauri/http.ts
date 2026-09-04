/**
 * Adaptador Tauri del puerto `HttpPort`.
 *
 * `plugin-http` sale por el backend Rust, así que no aplica CORS: puede leer
 * imágenes y archivos de cualquier origen sin que el servidor lo autorice.
 */

import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

import type { HttpPort } from '@/platform/ports/http';

export const tauriHttp: HttpPort = {
  async fetchBlob(url: string): Promise<Blob> {
    const response = await tauriFetch(url, { method: 'GET' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // plugin-http v2 implementa la Web Fetch API estándar: .blob() funciona.
    return response.blob();
  },
};
