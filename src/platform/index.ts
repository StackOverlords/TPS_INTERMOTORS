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

import { tauriAppUpdater } from './adapters/tauri/appUpdater';
import { tauriFileSystem } from './adapters/tauri/fileSystem';
import { tauriHttp } from './adapters/tauri/http';
import { tauriKeyValueStore } from './adapters/tauri/keyValueStore';
import { tauriKeybindingsRepository } from './adapters/tauri/keybindingsRepository';
import { tauriLogger } from './adapters/tauri/logger';
import { tauriPreferencesRepository } from './adapters/tauri/preferencesRepository';
import { tauriWindowChrome } from './adapters/tauri/windowChrome';
import { tauriWindowManager } from './adapters/tauri/windowManager';
import { webAppUpdater } from './adapters/web/appUpdater';
import { webFileSystem } from './adapters/web/fileSystem';
import { webHttp } from './adapters/web/http';
import { webKeyValueStore } from './adapters/web/keyValueStore';
import { webKeybindingsRepository } from './adapters/web/keybindingsRepository';
import { webLogger } from './adapters/web/logger';
import { webPreferencesRepository } from './adapters/web/preferencesRepository';
import { webWindowChrome } from './adapters/web/windowChrome';
import { webWindowManager } from './adapters/web/windowManager';
import { isTauri } from './env';
import type { AppUpdaterPort } from './ports/appUpdater';
import type { FileSystemPort } from './ports/fileSystem';
import type { HttpPort } from './ports/http';
import type { KeyValueStorePort } from './ports/keyValueStore';
import type { KeybindingsRepositoryPort } from './ports/keybindingsRepository';
import type { LoggerPort } from './ports/logger';
import type { PreferencesRepositoryPort } from './ports/preferencesRepository';
import type { WindowChromePort } from './ports/windowChrome';
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
export type { WindowChromePort } from './ports/windowChrome';
export type {
  AppUpdateInfo,
  AppUpdaterPort,
  UpdateProgress,
} from './ports/appUpdater';
export type { LogEntry, LoggerPort, LogLevel } from './ports/logger';
export type {
  KeybindingRecord,
  KeybindingsRepositoryPort,
} from './ports/keybindingsRepository';
export type {
  PreferenceRecord,
  PreferencesRepositoryPort,
  PreferenceType,
} from './ports/preferencesRepository';

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

let loggerInstance: LoggerPort | null = null;

/**
 * Sumidero persistente de logs del target activo.
 *
 * Escritorio: archivo de log de la app. Web: buffer en memoria acotado.
 */
export function getLogger(): LoggerPort {
  if (!loggerInstance) {
    loggerInstance = isTauri() ? tauriLogger : webLogger;
  }
  return loggerInstance;
}

let keybindingsRepositoryInstance: KeybindingsRepositoryPort | null = null;

/**
 * Persistencia de atajos personalizados del target activo.
 *
 * Escritorio: tabla `keybindings` de SQLite. Web: puerto de clave/valor.
 */
export function getKeybindingsRepository(): KeybindingsRepositoryPort {
  if (!keybindingsRepositoryInstance) {
    keybindingsRepositoryInstance = isTauri()
      ? tauriKeybindingsRepository
      : webKeybindingsRepository;
  }
  return keybindingsRepositoryInstance;
}

let preferencesRepositoryInstance: PreferencesRepositoryPort | null = null;

/**
 * Preferencias de usuario persistidas del target activo.
 *
 * Escritorio: tabla `user_preferences` de SQLite. Web: puerto de clave/valor.
 */
export function getPreferencesRepository(): PreferencesRepositoryPort {
  if (!preferencesRepositoryInstance) {
    preferencesRepositoryInstance = isTauri()
      ? tauriPreferencesRepository
      : webPreferencesRepository;
  }
  return preferencesRepositoryInstance;
}

let appUpdaterInstance: AppUpdaterPort | null = null;

/**
 * Versión de la app y actualizaciones del target activo.
 *
 * Escritorio: plugin-updater + relanzar el proceso.
 * Web: sin autoactualización (`supportsSelfUpdate()` es `false`).
 */
export function getAppUpdater(): AppUpdaterPort {
  if (!appUpdaterInstance) {
    appUpdaterInstance = isTauri() ? tauriAppUpdater : webAppUpdater;
  }
  return appUpdaterInstance;
}

let windowChromeInstance: WindowChromePort | null = null;

/**
 * Control del marco de la ventana actual del target activo.
 *
 * Escritorio: barra de título propia (la app corre sin decoraciones del SO).
 * Web: el navegador es el dueño; `hasCustomChrome()` es `false`.
 */
export function getWindowChrome(): WindowChromePort {
  if (!windowChromeInstance) {
    windowChromeInstance = isTauri() ? tauriWindowChrome : webWindowChrome;
  }
  return windowChromeInstance;
}
