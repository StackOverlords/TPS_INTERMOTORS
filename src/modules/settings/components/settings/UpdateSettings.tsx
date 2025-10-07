import { Button } from '@/components/atoms/button';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { AlertCircle, Loader2, RefreshCw, Download } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';

export default function UpdateSettings() {
  const {
    available,
    currentVersion,
    latestVersion,
    isChecking,
    isDownloading,
    isInstalling,
    downloadProgress,
    error,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
    clearError,
  } = useUpdateChecker();

  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion('1.0.0'));
  }, []);

  const displayCurrentVersion = currentVersion || appVersion;
  const displayLatestVersion = available ? latestVersion : displayCurrentVersion;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6 max-w-sm">
        {/* Version Display */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Versión actual</p>
          <p className="text-2xl font-light text-gray-600">{displayCurrentVersion}</p>
        </div>

        {/* Status */}
        {available && (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Nueva versión disponible</p>
            <p className="text-lg font-medium text-gray-700">{displayLatestVersion}</p>
          </div>
        )}

        {/* Progress */}
        {(isDownloading || isInstalling) && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                {isInstalling ? 'Instalando' : 'Descargando'}
              </span>
              <span className="text-xs text-gray-500">{Math.round(downloadProgress)}%</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-800 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && !error.includes('Ya estás en la última versión') && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!available && !isDownloading && !isInstalling && (
            <Button
              onClick={() => checkForUpdates(false)}
              disabled={isChecking}
              variant="ghost"
              size="sm"
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-3 w-3" />
                  Buscar actualizaciones
                </>
              )}
            </Button>
          )}

          {available && !isDownloading && !isInstalling && (
            <>
              <Button
                onClick={downloadAndInstall}
                size="sm"
                className="text-xs bg-gray-900 hover:bg-gray-800"
              >
                <Download className="mr-1.5 h-3 w-3" />
                Actualizar
              </Button>
              <Button
                onClick={dismissUpdate}
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Más tarde
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        {error && error.includes('Ya estás en la última versión') && (
          <p className="text-xs text-gray-400">Tienes la última versión</p>
        )}
      </div>
    </div>
  );
}
