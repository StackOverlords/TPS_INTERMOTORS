import { Alert, AlertDescription, AlertTitle } from "@/components/atoms/alert";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import { getAppUpdater } from "@/platform";
import { environment } from "@/utils/environment";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import ReleaseNotes from "./ReleaseNotes";

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
    releaseNotes,
    releaseDate,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
    supportsSelfUpdate,
  } = useUpdateChecker();

  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    getAppUpdater()
      .getCurrentVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion("1.0.0"));
  }, []);

  const displayCurrentVersion = currentVersion || appVersion;

  const handleDismiss = () => {
    // Si hay actualización disponible, la descarta temporalmente
    if (available) {
      dismissUpdate();
    }
  };

  // En web la app se actualiza sola al recargar: no hay binario que reemplazar,
  // así que mostramos la versión desplegada en vez de controles inertes.
  if (!supportsSelfUpdate) {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[60vh] p-2 bg-background rounded-lg border border-border">
        <div className="flex flex-col items-center max-w-5xl w-full px-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Versión {displayCurrentVersion || "—"}</AlertTitle>
            <AlertDescription>
              Estás usando la versión web, que se actualiza sola: al recargar la
              página siempre obtenés la última publicada.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center min-h-[60vh] p-2 bg-background rounded-lg border border-border">
      <div className="flex flex-col items-center max-w-5xl w-full px-4 h-full">
        <ReleaseNotes
          currentVersion={displayCurrentVersion}
          latestVersion={latestVersion}
          variant={environment.variant}
          releaseNotes={releaseNotes}
          releaseDate={releaseDate || undefined}
          hasUpdate={available}
          isChecking={isChecking}
          isDownloading={isDownloading}
          isInstalling={isInstalling}
          downloadProgress={downloadProgress}
          error={error}
          onCheckUpdate={() => checkForUpdates(false)}
          onDownloadUpdate={downloadAndInstall}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  );
}
