import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';
import ReleaseNotes from './ReleaseNotes';

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
  } = useUpdateChecker();

  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion('1.0.0'));
  }, []);

  const displayCurrentVersion = currentVersion || appVersion;

  const handleDismiss = () => {
    // Si hay actualización disponible, la descarta temporalmente
    if (available) {
      dismissUpdate();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-2">
      <div className="flex flex-col items-center gap-6 max-w-4xl w-full px-6">
        <ReleaseNotes
          currentVersion={displayCurrentVersion}
          latestVersion={latestVersion}
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
