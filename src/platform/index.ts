/**
 * Punto de entrada de la capa de plataforma.
 *
 * El código de negocio pide capacidades acá y nunca importa `@tauri-apps/*`
 * ni toca APIs del navegador directamente. Cambiar de target = cambiar de
 * adaptador, no de código de negocio.
 *
 * ── Por qué los dos adaptadores se importan estáticamente ────────────────────
 * La alternativa (import dinámico según el target) haría asíncrona la resolución,
 * y eso ROMPE el adaptador web: `window.open()` debe correr dentro del gesto del
 * usuario y un `await` previo lo invalida. Por eso resolvemos síncrono y pagamos
 * el precio de que el bundle web incluya el adaptador Tauri.
 *
 * Ese peso es una optimización posterior, no un problema de corrección: el
 * adaptador Tauri nunca se ejecuta en el navegador. Cuando el target web se
 * confirme, se reemplaza por un alias de Vite (`@/platform/adapters/active`)
 * resuelto en build, sin tocar un solo consumidor.
 */

import { tauriFileSystem } from './adapters/tauri/fileSystem';
import { tauriHttp } from './adapters/tauri/http';
import { tauriKeyValueStore } from './adapters/tauri/keyValueStore';
import { tauriWindowManager } from './adapters/tauri/windowManager';
import { webFileSystem } from './adapters/web/fileSystem';
import { webHttp } from './adapters/web/http';
import { webKeyValueStore } from './adapters/web/keyValueStore';
import { webWindowManager } from './adapters/web/windowManager';
import { isTauri } from './env';
import type { FileSystemPort } from './ports/fileSystem';
import type { HttpPort } from './ports/http';
import type { KeyValueStorePort } from './ports/keyValueStore';
import type { WindowManagerPort } from './ports/windowManager';

export { getPlatformTarget, isTauri } from './env';
export type { PlatformTarget } from './env';
export { PLATFORM_CLOSE_ALL_SECONDARY } from './ports/windowManager';
export type {
  SecondaryWindowConfig,
  SecondaryWindowHandle,
  WindowManagerPort,
} from './ports/windowManager';
export type {
  KeyValueStore,
  KeyValueStoreOptions,
  KeyValueStorePort,
} from './ports/keyValueStore';
export type {
  FileData,
  FileSystemPort,
  PickedTextFile,
  PickTextFileOptions,
  SaveFileRequest,
} from './ports/fileSystem';
export type { HttpPort } from './ports/http';

let windowManagerInstance: WindowManagerPort | null = null;

/**
 * Adaptador de ventanas del target activo.
 *
 * Resolución perezosa y cacheada: al momento de importar este módulo el runtime
 * de Tauri podría no haber inyectado todavía sus globals, así que decidimos en
 * el primer uso real. Sigue siendo síncrono — seguro para el gesto del usuario.
 */
export function getWindowManager(): WindowManagerPort {
  if (!windowManagerInstance) {
    windowManagerInstance = isTauri() ? tauriWindowManager : webWindowManager;
  }
  return windowManagerInstance;
}

let keyValueStoreInstance: KeyValueStorePort | null = null;

/**
 * Almacenamiento clave/valor persistente del target activo.
 *
 * Escritorio: un archivo JSON por store (`@tauri-apps/plugin-store`).
 * Web: claves con prefijo en `localStorage`.
 */
export function getKeyValueStore(): KeyValueStorePort {
  if (!keyValueStoreInstance) {
    keyValueStoreInstance = isTauri() ? tauriKeyValueStore : webKeyValueStore;
  }
  return keyValueStoreInstance;
}

let fileSystemInstance: FileSystemPort | null = null;

/**
 * Entrada/salida de archivos hacia el usuario del target activo.
 *
 * Escritorio: diálogos nativos del SO. Web: descarga del navegador.
 */
export function getFileSystem(): FileSystemPort {
  if (!fileSystemInstance) {
    fileSystemInstance = isTauri() ? tauriFileSystem : webFileSystem;
  }
  return fileSystemInstance;
}

let httpInstance: HttpPort | null = null;

/**
 * Descarga de binarios del target activo.
 *
 * Escritorio: por Rust, sin CORS. Web: `fetch`, sujeto a CORS.
 */
export function getHttp(): HttpPort {
  if (!httpInstance) {
    httpInstance = isTauri() ? tauriHttp : webHttp;
  }
  return httpInstance;
}
