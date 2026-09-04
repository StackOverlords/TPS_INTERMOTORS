/**
 * Adaptador Tauri del puerto `AppUpdaterPort`.
 *
 * Usa `plugin-updater` contra el endpoint declarado en `tauri.conf.json` y
 * relanza el proceso con `plugin-process`.
 */

import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, type Update } from '@tauri-apps/plugin-updater';

import type {
  AppUpdateInfo,
  AppUpdaterPort,
  UpdateProgress,
} from '@/platform/ports/appUpdater';

/** Handle de la actualización pendiente. No sale del adaptador. */
let pendingUpdate: Update | null = null;

export const tauriAppUpdater: AppUpdaterPort = {
  async getCurrentVersion() {
    return getVersion();
  },

  supportsSelfUpdate() {
    return true;
  },

  async checkForUpdate(): Promise<AppUpdateInfo | null> {
    const update = await check();

    if (!update?.available) {
      pendingUpdate = null;
      return null;
    }

    pendingUpdate = update;

    return {
      currentVersion: update.currentVersion,
      version: update.version,
      notes: update.body || null,
      date: update.date || null,
    };
  },

  async downloadAndInstall(onProgress: (progress: UpdateProgress) => void) {
    if (!pendingUpdate) {
      throw new Error('No hay una actualización pendiente para instalar');
    }

    await pendingUpdate.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          onProgress({
            phase: 'started',
            contentLength: event.data.contentLength ?? 0,
          });
          break;
        case 'Progress':
          onProgress({ phase: 'progress', chunkLength: event.data.chunkLength });
          break;
        case 'Finished':
          onProgress({ phase: 'finished' });
          break;
      }
    });
  },

  async relaunch() {
    await relaunch();
  },

  dismiss() {
    pendingUpdate = null;
  },
};
