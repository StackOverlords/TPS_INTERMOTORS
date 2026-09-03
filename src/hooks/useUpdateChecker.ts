import { getAppUpdater } from '@/platform';
import { environment } from '@/utils/environment';

import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

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
  releaseNotes: string | null;
  releaseDate: string | null;
  /**
   * `false` donde la app no puede autoactualizarse (web). La UI debe usarlo
   * para esconder la sección de actualizaciones en vez de mostrar botones que
   * no hacen nada.
   */
  supportsSelfUpdate: boolean;
}

const INITIAL_STATE: UpdateState = {
  available: false,
  currentVersion: '',
  latestVersion: '',
  variant: null,
  isChecking: false,
  isDownloading: false,
  isInstalling: false,
  downloadProgress: 0,
  error: null,
  releaseNotes: null,
  releaseDate: null,
  supportsSelfUpdate: false,
};

export const useUpdateChecker = () => {
  const [updateState, setUpdateState] = useState<UpdateState>(INITIAL_STATE);

  const checkForUpdates = useCallback(async (silent = true) => {
    const updater = getAppUpdater();

    // En web no hay binario que reemplazar: solo publicamos la versión actual.
    if (!updater.supportsSelfUpdate()) {
      const currentVersion = await updater.getCurrentVersion();
      setUpdateState(prev => ({
        ...prev,
        supportsSelfUpdate: false,
        available: false,
        currentVersion,
        latestVersion: currentVersion,
        variant: environment.variant,
        isChecking: false,
      }));
      return;
    }

    setUpdateState(prev => {
      if (prev.isChecking) return prev;
      return { ...prev, isChecking: true, error: null, supportsSelfUpdate: true };
    });

    try {
      const update = await updater.checkForUpdate();

      if (update) {
        setUpdateState(prev => ({
          ...prev,
          available: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version,
          variant: environment.variant,
          releaseNotes: update.notes,
          releaseDate: update.date,
          isChecking: false,
        }));
        return;
      }

      // Sin actualización: traemos las notas de la versión actual desde GitHub.
      const currentVersion = await updater.getCurrentVersion();
      let currentVersionNotes: string | null = null;
      let currentVersionDate: string | null = null;

      try {
        // El tag incluye la variante (ej. v1.1.29-t1).
        const tagWithVariant = environment.variant
          ? `v${currentVersion}-${environment.variant}`
          : `v${currentVersion}`;

        const response = await axios.get(
          `https://api.github.com/repos/StackOverlords/TPS_INTERMOTORS/releases/tags/${tagWithVariant}`
        );

        if (response.status === 200) {
          currentVersionNotes = response.data.body || null;
          currentVersionDate = response.data.published_at || null;
        }
      } catch (err) {
        console.error('Error fetching current version release notes:', err);
      }

      setUpdateState(prev => ({
        ...prev,
        available: false,
        currentVersion,
        latestVersion: currentVersion,
        variant: environment.variant,
        releaseNotes: currentVersionNotes,
        releaseDate: currentVersionDate,
        isChecking: false,
        error: silent ? prev.error : 'Ya estás en la última versión',
      }));
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
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  const downloadAndInstall = useCallback(async () => {
    const updater = getAppUpdater();

    setUpdateState(prev => ({
      ...prev,
      isDownloading: true,
      downloadProgress: 0,
      error: null,
    }));

    try {
      let downloaded = 0;
      let contentLength = 0;

      await updater.downloadAndInstall(progress => {
        switch (progress.phase) {
          case 'started':
            contentLength = progress.contentLength;
            break;
          case 'progress': {
            downloaded += progress.chunkLength;
            const percent =
              contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            setUpdateState(prev => ({ ...prev, downloadProgress: percent }));
            break;
          }
          case 'finished':
            setUpdateState(prev => ({
              ...prev,
              isDownloading: false,
              isInstalling: true,
            }));
            break;
        }
      });

      await updater.relaunch();
    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        isDownloading: false,
        isInstalling: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al descargar/instalar actualización',
      }));
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    getAppUpdater().dismiss();
    setUpdateState(prev => ({
      ...prev,
      available: false,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setUpdateState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...updateState,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
    clearError,
  };
};
