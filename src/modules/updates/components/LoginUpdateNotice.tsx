import { Button } from "@/components/atoms/button";
import { Progress } from "@/components/atoms/progress";
import { AlertCircle, ArrowDownToLine, Loader2 } from "lucide-react";
import { displayVersion } from "../utils/version";

interface LoginUpdateNoticeProps {
  version: string;
  currentVersion: string;
  isDownloading: boolean;
  isInstalling: boolean;
  /** 0–100. */
  progress: number;
  error: string | null;
  onUpdate: () => void;
  onShowNotes: () => void;
}

/**
 * Aviso de versión nueva debajo del formulario de inicio de sesión. Actualizar
 * es opcional: también se puede hacer desde Configuración > Actualizaciones.
 */
export function LoginUpdateNotice({
  version,
  currentVersion,
  isDownloading,
  isInstalling,
  progress,
  error,
  onUpdate,
  onShowNotes,
}: LoginUpdateNoticeProps) {
  const busy = isDownloading || isInstalling;

  return (
    <section
      aria-label="Actualización disponible"
      aria-live="polite"
      className="rounded-lg border border-primary/30 bg-card p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <ArrowDownToLine className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">
            Versión {displayVersion(version)} disponible
          </p>
          <p className="text-xs text-muted-foreground">
            {busy
              ? "La aplicación se reiniciará sola al terminar."
              : `Tienes la ${displayVersion(currentVersion)}. Puedes actualizar ahora o más tarde desde Configuración > Actualizaciones.`}
          </p>
        </div>
      </div>

      {busy ? (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              {isInstalling ? "Instalando…" : "Descargando…"}
            </span>
            <span className="tabular-nums">{Math.round(progress)} %</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="mt-3 flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onShowNotes}>
              Ver novedades
            </Button>
            <Button size="sm" onClick={onUpdate}>
              {error ? "Reintentar" : "Actualizar ahora"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
