/**
 * Conjunto de adaptadores del target WEB.
 *
 * Gemelo de `adapters/tauri/index.ts`. Ver la nota de ese archivo: el alias
 * `@platform-adapters` resuelve a uno u otro según `BUILD_TARGET`, así que el
 * bundle web no arrastra ni una línea de `@tauri-apps`.
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

import { webAppUpdater } from './appUpdater';
import { webClipboard } from './clipboard';
import { webFileSystem } from './fileSystem';
import { webHttp } from './http';
import { webImageProcessor } from './imageProcessor';
import { webKeybindingsRepository } from './keybindingsRepository';
import { webKeyValueStore } from './keyValueStore';
import { webLogger } from './logger';
import { webPreferencesRepository } from './preferencesRepository';
import { webWindowChrome } from './windowChrome';
import { webWindowManager } from './windowManager';

/** Identifica el conjunto activo. Se usa para el chequeo de coherencia en dev. */
export const ADAPTER_TARGET = 'web' as const;

export const appUpdater: AppUpdaterPort = webAppUpdater;
export const clipboard: ClipboardPort = webClipboard;
export const fileSystem: FileSystemPort = webFileSystem;
export const http: HttpPort = webHttp;
export const imageProcessor: ImageProcessorPort = webImageProcessor;
export const keybindingsRepository: KeybindingsRepositoryPort =
  webKeybindingsRepository;
export const keyValueStore: KeyValueStorePort = webKeyValueStore;
export const logger: LoggerPort = webLogger;
export const preferencesRepository: PreferencesRepositoryPort =
  webPreferencesRepository;
export const windowChrome: WindowChromePort = webWindowChrome;
export const windowManager: WindowManagerPort = webWindowManager;
