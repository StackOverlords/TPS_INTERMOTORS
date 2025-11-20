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

interface ReleaseNotesProps {
  // Información de versión
  currentVersion: string;
  latestVersion?: string;

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

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Contenido/Detalles (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {releaseNotes
                ? `Novedades en v${hasUpdate ? latestVersion : currentVersion}`
                : 'Actualizaciones'}
            </h3>
            <p className="text-sm text-gray-500">
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
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 group -ml-1"
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
                        color: '#374151',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      }}
                      wrapperElement={{
                        'data-color-mode': 'light',
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
              <p className="text-gray-500 mb-4">
                Estás en la última versión conocida
              </p>
              <p className="text-xs text-gray-400">
                Usa el botón "Buscar actualizaciones" para verificar si hay nuevas versiones
              </p>
            </div>
          )}
        </div>

        {/* Columna Derecha - Detalles Técnicos y Acciones (1/3) */}
        <div className="space-y-6">
          {/* Card de información */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 space-y-4">
            {/* Versión actual */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Package className="h-3.5 w-3.5" />
                <span>Versión actual</span>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{currentVersion}</p>
            </div>

            {/* Nueva versión disponible */}
            {hasUpdate && latestVersion && (
              <div className="space-y-1 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-blue-700">Nueva versión</span>
                </div>
                <p className="text-xl font-semibold text-blue-800">{latestVersion}</p>
              </div>
            )}

            {/* Fecha de lanzamiento */}
            {releaseDate && (
              <div className="space-y-1 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Fecha de lanzamiento</span>
                </div>
                <p className="text-sm text-gray-700">
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
              <div className="pt-3 border-t border-gray-200">
                <a
                  href={`https://github.com/StackOverlords/TPS_INTERMOTORS/releases/tag/v${currentVersion}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver en GitHub
                </a>
              </div>
            )}
          </div>

          {/* Progreso de descarga/instalación */}
          {(isDownloading || isInstalling) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {isInstalling ? 'Instalando...' : 'Descargando...'}
                </span>
                <span className="text-sm font-semibold text-blue-900">
                  {Math.round(downloadProgress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !error.includes('Ya estás en la última versión') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
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
            <p className="text-xs text-center text-gray-400">Tienes la última versión</p>
          )}
        </div>
      </div>
    </div>
  );
}
