import { fetchReleaseNotes } from '@/modules/updates/api/releaseNotes';
import { describeUpdateError } from '@/modules/updates/utils/updateError';
import { getAppUpdater } from '@/platform';
import { environment } from '@/utils/environment';

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

export interface UseUpdateCheckerOptions {
  /**
   * Sin versión nueva, traer de GitHub las notas de la versión instalada
   * (las muestra Configuración > Actualizaciones). El login no las usa: así no
   * gasta una consulta a la API de GitHub, que limita a 60 por hora por IP.
   */
  loadCurrentNotes?: boolean;
}

export const useUpdateChecker = ({ loadCurrentNotes = true }: UseUpdateCheckerOptions = {}) => {
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

      if (loadCurrentNotes) {
        try {
          const release = await fetchReleaseNotes(currentVersion, environment.variant);
          currentVersionNotes = release.notes;
          currentVersionDate = release.date;
        } catch (err) {
          console.error('Error fetching current version release notes:', err);
        }
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
      const errorMessage = `No se pudo buscar actualizaciones: ${describeUpdateError(error)}`;

      setUpdateState(prev => ({
        ...prev,
        isChecking: false,
        error: errorMessage,
      }));
    }
  }, [loadCurrentNotes]);

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
        // Tauri rechaza con un string: sin esto se perdía el motivo real.
        error: `No se pudo actualizar: ${describeUpdateError(error)}`,
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
