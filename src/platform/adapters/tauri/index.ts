/**
 * Conjunto de adaptadores del target ESCRITORIO.
 *
 * Este barrel es uno de los dos extremos del alias `@platform-adapters`
 * (ver `vite.config.ts`). El bundle resuelve a este archivo o al de `web/`
 * según `BUILD_TARGET`, nunca a los dos: el código del target contrario ni
 * siquiera entra al artefacto.
 *
 * Cada export está anotado con el tipo de su puerto a propósito. Así, si un
 * adaptador se desincroniza del contrato, lo detecta `tsc` acá — en el barrel—
 * y no en runtime dentro del target que nadie está probando en ese momento.
 */

import type { AppUpdaterPort } from '@/platform/ports/appUpdater';
import type { ClipboardPort } from '@/platform/ports/clipboard';
import type { FileSystemPort } from '@/platform/ports/fileSystem';
import type { HttpPort } from '@/platform/ports/http';
import type { ImageProcessorPort } from '@/platform/ports/imageProcessor';
import type { KeybindingsRepositoryPort } from '@/platform/ports/keybindingsRepository';
import type { KeyValueStorePort } from '@/platform/ports/keyValueStore';
import type { LoggerPort } from '@/platform/ports/logger';
import type { PreferencesRepositoryPort } from '@/platform/ports/preferencesRepository';
import type { WindowChromePort } from '@/platform/ports/windowChrome';
import type { WindowManagerPort } from '@/platform/ports/windowManager';

import { tauriAppUpdater } from './appUpdater';
import { tauriClipboard } from './clipboard';
import { tauriFileSystem } from './fileSystem';
import { tauriHttp } from './http';
import { tauriImageProcessor } from './imageProcessor';
import { tauriKeybindingsRepository } from './keybindingsRepository';
import { tauriKeyValueStore } from './keyValueStore';
import { tauriLogger } from './logger';
import { tauriPreferencesRepository } from './preferencesRepository';
import { tauriWindowChrome } from './windowChrome';
import { tauriWindowManager } from './windowManager';

/** Identifica el conjunto activo. Se usa para el chequeo de coherencia en dev. */
export const ADAPTER_TARGET = 'tauri' as const;

export const appUpdater: AppUpdaterPort = tauriAppUpdater;
export const clipboard: ClipboardPort = tauriClipboard;
export const fileSystem: FileSystemPort = tauriFileSystem;
export const http: HttpPort = tauriHttp;
export const imageProcessor: ImageProcessorPort = tauriImageProcessor;
export const keybindingsRepository: KeybindingsRepositoryPort =
  tauriKeybindingsRepository;
export const keyValueStore: KeyValueStorePort = tauriKeyValueStore;
export const logger: LoggerPort = tauriLogger;
export const preferencesRepository: PreferencesRepositoryPort =
  tauriPreferencesRepository;
export const windowChrome: WindowChromePort = tauriWindowChrome;
export const windowManager: WindowManagerPort = tauriWindowManager;
