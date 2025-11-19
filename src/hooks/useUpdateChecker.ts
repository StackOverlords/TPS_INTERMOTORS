import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';
import { useEffect, useState } from 'react';

export interface UpdateState {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
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
    isChecking: false,
    isDownloading: false,
    isInstalling: false,
    downloadProgress: 0,
    error: null,
    update: null,
    releaseNotes: null,
    releaseDate: null,
  });

  // Check on mount
  useEffect(() => {
    // Simular que acabamos de actualizar (para testing)
    // IMPORTANTE: En la app buildeada, borra localStorage.lastSeenVersion para simular primera vez
    // O ponlo en '1.1.3' para simular que acabas de actualizar de 1.1.3 a 1.1.4

    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      checkForUpdates();
    } else {
      // Modo browser (desarrollo): simular que acabamos de actualizar
      const demoReleaseNotes = `
## 🚀 Nueva version v1.1.4

![image](https://i.ibb.co/Z1RYJ3Jd/Captura-de-pantalla-20251118-003142.png)

## 🚀 Novedades

- 🪟 Ventanas múltiples optimizadas
- 💰 Cuentas por pagar
- 🖼️ Visualizador de imagene del producto

## 🐛 Errores corregidos

<details><summary>Ver lista completa de correcciones</summary>
<ul>
    <li><input type="checkbox" checked> Crasheo al abrir vistas con tablas</li>
</ul>
</details>

---

### 📦 Instalación

- **Windows MSI**: \`TPS-Intermotors_1.1.4_x64_en-US.msi\`
- **Windows NSIS**: \`TPS-Intermotors_1.1.4_x64-setup.exe\`
`;

      localStorage.setItem('lastSeenVersion', '1.1.3');
      setUpdateState(prev => ({
        ...prev,
        currentVersion: '1.1.4',
        releaseNotes: demoReleaseNotes,
        releaseDate: new Date().toISOString(),
      }));
    }
  }, []);

  const checkForUpdates = async (silent = true) => {
    // Solo funciona en Tauri
    if (typeof window === 'undefined' || !('__TAURI__' in window)) {
      console.log('Update checker only works in Tauri app');
      return;
    }

    if (updateState.isChecking) return;

    setUpdateState(prev => ({
      ...prev,
      isChecking: true,
      error: null,
    }));

    try {
      const update = await check();
      // console.log('[Updater] Respuesta recibida:', {
      //   available: update?.available,
      //   currentVersion: update?.currentVersion,
      //   latestVersion: update?.version,
      // });

      // Verificar si acabamos de actualizar comparando con localStorage
      const lastSeenVersion = localStorage.getItem('lastSeenVersion');
      const currentVersion = update?.currentVersion || '';
      const justUpdated = lastSeenVersion && lastSeenVersion !== currentVersion;

      // Obtener las notas de la versión ACTUAL si acabamos de actualizar
      let currentVersionNotes = null;
      let currentVersionDate = null;

      if (justUpdated) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/StackOverlords/TPS_INTERMOTORS/releases/tags/v${currentVersion}`
          );
          const releaseData = await response.json();
          currentVersionNotes = releaseData.body || null;
          currentVersionDate = releaseData.published_at || null;
        } catch (err) {
          console.error('Error fetching current version release notes:', err);
        }
      }

      if (update && 'available' in update && update.available) {
        // console.log('[Updater] ✅ Nueva actualización disponible:', update.version);
        // Hay una actualización disponible, pero PRIORIZAMOS las notas de la versión actual si acabamos de actualizar
        setUpdateState(prev => ({
          ...prev,
          available: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version,
          update,
          // Mostrar las notas de la versión ACTUAL si acabamos de actualizar, sino las de la futura
          releaseNotes: currentVersionNotes || update.body || null,
          releaseDate: currentVersionDate || update.date || null,
          isChecking: false,
        }));
      } else {
        // console.log('[Updater] ✓ Ya estás en la última versión');
        setUpdateState(prev => ({
          ...prev,
          available: false,
          currentVersion: currentVersion,
          latestVersion: currentVersion,
          // Mostrar las notas de la versión actual si acabamos de actualizar
          releaseNotes: currentVersionNotes,
          releaseDate: currentVersionDate,
          isChecking: false,
        }));

        if (!silent) {
          // Si no es silencioso, el usuario verá el mensaje en la UI
          setUpdateState(prev => ({
            ...prev,
            error: 'Ya estás en la última versión',
          }));
        }
      }
    } catch (error) {
      // console.error('[Updater] ❌ Error al verificar actualizaciones:', error);
      // console.error('[Updater] Stack trace:', error instanceof Error ? error.stack : 'No stack available');
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
    if (!updateState.update) {
      // console.error('[Updater] No hay actualización disponible para descargar');
      return;
    }

    // console.log('[Updater] Iniciando descarga e instalación...');
    setUpdateState(prev => ({
      ...prev,
      isDownloading: true,
      downloadProgress: 0,
      error: null,
    }));

    try {
      // Descargar con progreso
      let downloaded = 0;
      let contentLength = 0;

      await updateState.update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            // console.log(`[Updater] 📥 Iniciando descarga: ${(contentLength / 1024 / 1024).toFixed(2)} MB`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            // console.log(`[Updater] 📊 Progreso: ${progress.toFixed(1)}% (${(downloaded / 1024 / 1024).toFixed(2)} MB)`);
            setUpdateState(prev => ({
              ...prev,
              downloadProgress: progress,
            }));
            break;
          case 'Finished':
            // console.log('[Updater] ✅ Descarga completada, instalando...');
            setUpdateState(prev => ({
              ...prev,
              isDownloading: false,
              isInstalling: true,
            }));
            break;
        }
      });

      // Reiniciar la aplicación para aplicar la actualización
      await relaunch();
    } catch (error) {
      // console.error('[Updater] ❌ Error durante descarga/instalación:', error);
      // console.error('[Updater] Detalles del error:', {
      //   message: error instanceof Error ? error.message : 'Unknown error',
      //   stack: error instanceof Error ? error.stack : undefined,
      //   raw: error,
      // });
      setUpdateState(prev => ({
        ...prev,
        isDownloading: false,
        isInstalling: false,
        error: error instanceof Error ? error.message : 'Error al descargar/instalar actualización'+JSON.stringify(error),
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
