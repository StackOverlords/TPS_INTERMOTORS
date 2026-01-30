import { Button } from '@/components/atoms/button';
import MarkdownPreview from '@uiw/react-markdown-preview';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Download,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
} from 'lucide-react';
import React from 'react';
import { useThemeStore } from '@/stores/themeStore';

interface ReleaseNotesProps {
  // Información de versión
  currentVersion: string;
  latestVersion?: string;
  variant?: string | null;

  // Release notes
  releaseNotes: string | null;
  releaseDate?: string;

  // Estados de actualización
  hasUpdate: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  isInstalling: boolean;
  downloadProgress: number;
  error: string | null;

  // Acciones
  onCheckUpdate: () => void;
  onDownloadUpdate: () => void;
  onDismiss: () => void;
}

export default function ReleaseNotes({
  currentVersion,
  latestVersion,
  variant,
  releaseNotes,
  releaseDate,
  hasUpdate,
  isChecking,
  isDownloading,
  isInstalling,
  downloadProgress,
  error,
  onCheckUpdate,
  onDownloadUpdate,
  // onDismiss,
}: ReleaseNotesProps) {
  const [showDetails, setShowDetails] = React.useState(true);
  const { resolvedTheme } = useThemeStore();
  // alert(JSON.stringify(variant));
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Contenido/Detalles (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              {releaseNotes
                ? `Novedades en v${hasUpdate ? latestVersion : currentVersion}`
                : 'Actualizaciones'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {releaseNotes
                ? (hasUpdate
                    ? `Nueva versión disponible para actualizar`
                    : 'Ver las mejoras y cambios de esta versión')
                : 'Mantén tu aplicación actualizada'}
            </p>
          </div>

          {/* Si hay release notes */}
          {releaseNotes && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group -ml-1"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ease-out ${
                    showDetails ? 'rotate-180' : 'rotate-0'
                  }`}
                />
                <span className="group-hover:underline">
                  {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                </span>
              </button>

              {/* Contenido de las notas con animación suave */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  showDetails ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                {showDetails && (
                  <div className="max-h-[60vh] overflow-y-auto pr-4">
                    <MarkdownPreview
                      source={releaseNotes}
                      style={{
                        backgroundColor: 'transparent',
                        color: resolvedTheme === 'dark' ? '#f9fafb' : '#374151',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      }}
                      wrapperElement={{
                        'data-color-mode': resolvedTheme === 'dark' ? 'dark' : 'light',
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Si NO hay release notes, mostrar estado simple */}
          {!releaseNotes && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Estás en la última versión conocida
              </p>
              <p className="text-xs text-muted-foreground">
                Usa el botón "Buscar actualizaciones" para verificar si hay nuevas versiones
              </p>
            </div>
          )}
        </div>

        {/* Columna Derecha - Detalles Técnicos y Acciones (1/3) */}
        <div className="space-y-6">
          {/* Card de información */}
          <div className="bg-muted/30 rounded-lg border border-border p-2 space-y-4">
            {/* Versión actual */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                <span>Versión actual</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-foreground">{currentVersion}</p>
                {variant && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-primary/20 dark:bg-primary/30 text-primary rounded-md uppercase">
                    {variant}
                  </span>
                )}
              </div>
            </div>

            {/* Nueva versión disponible */}
            {hasUpdate && latestVersion && (
              <div className="space-y-1 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-primary">Nueva versión</span>
                </div>
                <p className="text-xl font-semibold text-primary">{latestVersion}</p>
              </div>
            )}

            {/* Fecha de lanzamiento */}
            {releaseDate && (
              <div className="space-y-1 pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Fecha de lanzamiento</span>
                </div>
                <p className="text-sm text-foreground">
                  {new Date(releaseDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {/* Enlace al release en GitHub */}
            {releaseNotes && (
              <div className="pt-3 border-t border-border">
                <a
                  href={`https://github.com/StackOverlords/TPS_INTERMOTORS/releases/tag/v${currentVersion}${variant ? `-${variant}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:opacity-80 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver en GitHub
                </a>
              </div>
            )}
          </div>

          {/* Progreso de descarga/instalación */}
          {(isDownloading || isInstalling) && (
            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {isInstalling ? 'Instalando...' : 'Descargando...'}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {Math.round(downloadProgress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !error.includes('Ya estás en la última versión') && (
            <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/40 dark:border-destructive/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            {/* Botón principal: Actualizar o Buscar */}
            {hasUpdate ? (
              <Button
                onClick={onDownloadUpdate}
                variant="default"
                className="w-full gap-2"
                disabled={isDownloading || isInstalling}
              >
                <Download className="h-4 w-4" />
                {isDownloading || isInstalling
                  ? 'Actualizando...'
                  : `Actualizar a v${latestVersion}`}
              </Button>
            ) : (
              <Button
                onClick={onCheckUpdate}
                variant="default"
                className="w-full gap-2"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Buscar actualizaciones
                  </>
                )}
              </Button>
            )}

            {/* Botón secundario: Cerrar (solo si hay release notes) */}
            {/* {releaseNotes && !isDownloading && !isInstalling && (
              <Button onClick={onDismiss} variant="ghost" className="w-full text-xs">
                {hasUpdate ? 'Más tarde' : 'Cerrar'}
              </Button>
            )} */}
          </div>

          {/* Info adicional */}
          {/* {releaseNotes && (
            <div className="text-xs text-gray-500 space-y-2">
              <p>Esta ventana se muestra automáticamente cuando se instala una nueva versión.</p>
              <p>Puedes volver a ver las notas en cualquier momento desde GitHub.</p>
            </div>
          )} */}

          {/* Mensaje de última versión */}
          {error && error.includes('Ya estás en la última versión') && (
            <p className="text-xs text-center text-muted-foreground">Tienes la última versión</p>
          )}
        </div>
      </div>
    </div>
  );
}
