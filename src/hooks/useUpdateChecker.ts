import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';

import axios from 'axios';
import { useEffect, useState } from 'react';

export interface UpdateState {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  variant: string | null;
  isChecking: boolean;
  isDownloading: boolean;
  isInstalling: boolean;
  downloadProgress: number;
  error: string | null;
  update: Update | null;
  releaseNotes: string | null;
  releaseDate: string | null;
}

export const useUpdateChecker = () => {
  const [updateState, setUpdateState] = useState<UpdateState>({
    available: false,
    currentVersion: '',
    latestVersion: '',
    variant: null,
    isChecking: false,
    isDownloading: false,
    isInstalling: false,
    downloadProgress: 0,
    error: null,
    update: null,
    releaseNotes: null,
    releaseDate: null,
  });

  // Get variant from environment variable
  const appVariant = import.meta.env.VITE_APP_VARIANT || null;

  // Check on mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async (silent = true) => {
    if (updateState.isChecking) return;

    setUpdateState(prev => ({
      ...prev,
      isChecking: true,
      error: null,
    }));

    try {
      const update = await check();
      const currentVersion = update?.currentVersion || await getVersion();

      if (update && 'available' in update && update.available) {
        // Hay actualización disponible
        setUpdateState(prev => ({
          ...prev,
          available: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version,
          variant: appVariant,
          update,
          releaseNotes: update.body || null,
          releaseDate: update.date || null,
          isChecking: false,
        }));
      } else {
        // No hay actualización - obtener notas de la versión actual desde GitHub
        let currentVersionNotes = null;
        let currentVersionDate = null;

        try {
          // Build the correct tag with variant (e.g., v1.1.29-t1)
          const tagWithVariant = appVariant ? `v${currentVersion}-${appVariant}` : `v${currentVersion}`;

          const response = await axios.get(
            `https://api.github.com/repos/StackOverlords/TPS_INTERMOTORS/releases/tags/${tagWithVariant}`
          );
          if (response.status === 200) {
            const releaseData = response.data;
            currentVersionNotes = releaseData.body || null;
            currentVersionDate = releaseData.published_at || null;
          }
        } catch (err) {
          console.error('Error fetching current version release notes:', err);
        }

        setUpdateState(prev => ({
          ...prev,
          available: false,
          currentVersion: currentVersion,
          latestVersion: currentVersion,
          variant: appVariant,
          releaseNotes: currentVersionNotes,
          releaseDate: currentVersionDate,
          isChecking: false,
        }));

        if (!silent) {
          setUpdateState(prev => ({
            ...prev,
            error: 'Ya estás en la última versión',
          }));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `Error: ${error.message}`
        : `Error al verificar actualizaciones: ${JSON.stringify(error)}`;

      setUpdateState(prev => ({
        ...prev,
        isChecking: false,
        error: errorMessage,
      }));
    }
  };

  const downloadAndInstall = async () => {
    if (!updateState.update) return;

    setUpdateState(prev => ({
      ...prev,
      isDownloading: true,
      downloadProgress: 0,
      error: null,
    }));

    try {
      let downloaded = 0;
      let contentLength = 0;

      await updateState.update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            setUpdateState(prev => ({
              ...prev,
              downloadProgress: progress,
            }));
            break;
          case 'Finished':
            setUpdateState(prev => ({
              ...prev,
              isDownloading: false,
              isInstalling: true,
            }));
            break;
        }
      });

      await relaunch();
    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        isDownloading: false,
        isInstalling: false,
        error: error instanceof Error ? error.message : 'Error al descargar/instalar actualización',
      }));
    }
  };

  const dismissUpdate = () => {
    setUpdateState(prev => ({
      ...prev,
      available: false,
      update: null,
      error: null,
    }));
  };

  const clearError = () => {
    setUpdateState(prev => ({
      ...prev,
      error: null,
    }));
  };

  return {
    ...updateState,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
    clearError,
  };
};
