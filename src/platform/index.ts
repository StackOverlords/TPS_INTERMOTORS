/**
 * Punto de entrada de la capa de plataforma.
 *
 * El código de negocio pide capacidades acá y nunca importa `@tauri-apps/*`
 * ni toca APIs del navegador directamente. Cambiar de target = cambiar de
 * adaptador, no de código de negocio.
 *
 * ── Selección del adaptador: en BUILD, no en runtime ─────────────────────────
 * `@platform-adapters` es un alias de Vite que resuelve a
 * `adapters/tauri/index.ts` o `adapters/web/index.ts` según `BUILD_TARGET`
 * (ver `vite.config.ts`). Sin la variable, resuelve a `tauri`: así los comandos
 * que ya invoca Tauri (`npm run dev`, `npm run build`) siguen funcionando igual.
 *
 * Consecuencia: el bundle de cada target NO contiene el código del otro. El
 * artefacto web no arrastra ni una línea de `@tauri-apps`.
 *
 * ── Por qué el acceso sigue siendo SÍNCRONO ──────────────────────────────────
 * `window.open()` y `requestFullscreen()` solo se permiten dentro del gesto del
 * usuario: cualquier `await` previo hace que el navegador los bloquee EN
 * SILENCIO. Por eso los `get*()` resuelven sin `await` y el alias se resuelve en
 * build — un import dinámico por target volvería asíncrona la resolución y
 * rompería el target web.
 */

import * as adapters from '@platform-adapters';

import { getPlatformTarget } from './env';

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
  SaveFileResult,
} from './ports/fileSystem';
export type { HttpPort } from './ports/http';
export type { WindowChromePort } from './ports/windowChrome';
export type { ClipboardPort } from './ports/clipboard';
export type {
  CompressToWebPOptions,
  ImageInfo,
  ImageProcessorPort,
} from './ports/imageProcessor';
export type { LoggerPort, LogLevel } from './ports/logger';
export type {
  AppUpdateInfo,
  AppUpdaterPort,
  UpdateProgress,
} from './ports/appUpdater';
export type {
  KeybindingRecord,
  KeybindingsRepositoryPort,
} from './ports/keybindingsRepository';
export type {
  PreferenceRecord,
  PreferencesRepositoryPort,
  PreferenceType,
} from './ports/preferencesRepository';

/**
 * Chequeo de coherencia: el target compilado tiene que coincidir con el host
 * real. Si no coinciden, la app va a fallar en el primer uso de una capacidad
 * nativa, y ese error sería críptico ("undefined is not a function" adentro de
 * `@tauri-apps`). Acá el diagnóstico llega antes y dice qué pasó.
 *
 * Solo en desarrollo: en producción el artefacto ya está fijado y el chequeo
 * sería ruido.
 */
if (import.meta.env.DEV) {
  const host = getPlatformTarget();
  if (adapters.ADAPTER_TARGET !== host) {
    console.error(
      `[platform] Build compilada para "${adapters.ADAPTER_TARGET}" pero corriendo en "${host}". ` +
        `Usá "npm run dev" para escritorio o "npm run dev:web" para el navegador.`,
    );
  }
}

export const getWindowManager = () => adapters.windowManager;
export const getWindowChrome = () => adapters.windowChrome;
export const getKeyValueStore = () => adapters.keyValueStore;
export const getFileSystem = () => adapters.fileSystem;
export const getHttp = () => adapters.http;
export const getLogger = () => adapters.logger;
export const getAppUpdater = () => adapters.appUpdater;
export const getImageProcessor = () => adapters.imageProcessor;
export const getClipboard = () => adapters.clipboard;
export const getKeybindingsRepository = () => adapters.keybindingsRepository;
export const getPreferencesRepository = () => adapters.preferencesRepository;
