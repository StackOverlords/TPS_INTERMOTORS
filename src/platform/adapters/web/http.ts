/**
 * Adaptador web del puerto `HttpPort`.
 *
 * ⚠️ A diferencia del target escritorio, acá rige CORS. Si el recurso vive en
 * otro origen, ese servidor debe responder con `Access-Control-Allow-Origin`.
 * Sirviendo la app desde el `public/` del backend, los archivos propios quedan
 * en el mismo origen y el problema desaparece; solo pueden fallar URLs externas.
 *
 * El mensaje de error distingue ese caso para no mandar a nadie a depurar la
 * red cuando en realidad lo que falta es una cabecera.
 */

import type { HttpPort } from '@/platform/ports/http';

export const webHttp: HttpPort = {
  async fetchBlob(url: string): Promise<Blob> {
    let response: Response;

    try {
      response = await fetch(url, { method: 'GET', credentials: 'omit' });
    } catch (error) {
      throw new Error(
        `No se pudo descargar "${url}". Si el archivo está en otro dominio, ` +
          `ese servidor debe permitir el acceso por CORS. Detalle: ${String(error)}`,
      );
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.blob();
  },
};
