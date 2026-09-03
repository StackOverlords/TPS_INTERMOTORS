/**
 * Puerto: acceso HTTP de bajo nivel para descargar binarios.
 *
 * NO reemplaza al cliente de la API de negocio (`src/services/axios.ts`), que ya
 * es agnóstico al target. Cubre el caso puntual de traerse un archivo o una
 * imagen desde una URL arbitraria.
 *
 * La diferencia real entre targets es CORS:
 *  - Escritorio: `@tauri-apps/plugin-http` sale por Rust, así que no hay CORS.
 *  - Web: rige la política del navegador. El servidor de origen debe permitir
 *    la lectura (`Access-Control-Allow-Origin`), o hay que servir el archivo
 *    desde el mismo origen que la app (lo natural sirviendo desde el backend).
 */

export interface HttpPort {
  /** Descarga el recurso como `Blob`. Lanza si la respuesta no es 2xx. */
  fetchBlob(url: string): Promise<Blob>;
}
