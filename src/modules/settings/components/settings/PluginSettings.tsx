/**
 * PluginSettings — UI de gestión de plugins externos para la pantalla de Configuración.
 *
 * Fase 4 Batch D: pantalla completa de gestión de plugins.
 *
 * Responsabilidades:
 * - Listar plugins instalados (TauriPluginSource.list())
 * - Instalar desde directorio/archivo (plugin-dialog)
 * - Activar/Desactivar en vivo (setEnabled + loadExternalPlugins / deactivate)
 * - Desinstalar con confirmación (AlertDialog)
 * - Mostrar errores de carga del bootstrap (LoadResult.status === "failed")
 */

import { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/alert-dialog";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Switch } from "@/components/atoms/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { cn } from "@/lib/utils";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Package,
  PackageX,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBootstrapLoadResults,
  loadExternalPlugins,
  PluginManager,
  TauriPluginSource,
} from "@/plugins";
import type { ExternalPluginRef, LoadResult } from "@/plugins";

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

/** Estado de la UI enriquecido: pluginRef + resultado de la última carga del bootstrap. */
interface PluginRow {
  ref: ExternalPluginRef;
  /** Resultado de carga del bootstrap (si existe). Indica si hubo error al cargar. */
  loadResult?: LoadResult;
}

// ---------------------------------------------------------------------------
// Singleton de la fuente de plugins
// ---------------------------------------------------------------------------

const source = new TauriPluginSource();

// Los LoadResults del bootstrap (badges de error de carga) se leen vía
// `getBootstrapLoadResults()` del módulo `@/plugins/bootstrapLoadResults`,
// que `main.tsx` puebla tras `loadExternalPlugins()` sin arrastrar esta
// pantalla al bundle inicial.

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

const PluginSettings = () => {
  const [plugins, setPlugins] = useState<PluginRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [pendingUninstall, setPendingUninstall] = useState<ExternalPluginRef | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);

  // Ref para evitar doble-carga en StrictMode de React
  const loadedRef = useRef(false);

  const loadPlugins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const refs = await source.list();
      const bootstrapResults = getBootstrapLoadResults();

      const rows: PluginRow[] = refs.map((ref) => ({
        ref,
        loadResult: bootstrapResults.find((r) => r.id === ref.id),
      }));

      setPlugins(rows);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`No se pudieron cargar los plugins: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void loadPlugins();
  }, []);

  // ── Instalar ──────────────────────────────────────────────────────────────

  const handleInstall = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: "Seleccioná la carpeta del plugin",
      });

      if (!selected) return;

      const path = selected;
      if (!path) return;

      setInstallingId(path);
      const newRef = await source.install(path);
      toast.success(`Plugin "${newRef.name}" instalado correctamente`);
      await loadPlugins();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al instalar el plugin`, { description: msg });
    } finally {
      setInstallingId(null);
    }
  };

  // ── Activar / Desactivar ──────────────────────────────────────────────────

  const handleToggle = async (row: PluginRow, nextEnabled: boolean) => {
    const { id, name } = row.ref;
    setTogglingId(id);

    try {
      await source.setEnabled(id, nextEnabled);

      if (nextEnabled) {
        // Cargar y activar el plugin en vivo
        const results = await loadExternalPlugins(source, PluginManager);
        const result = results.find((r) => r.id === id);

        if (result?.status === "failed") {
          // Revertir — el plugin no pudo cargarse
          await source.setEnabled(id, false);
          toast.error(`No se pudo activar "${name}"`, {
            description: result.error,
          });
          // Actualizar el loadResult en la UI
          setPlugins((prev) =>
            prev.map((p) =>
              p.ref.id === id
                ? { ...p, ref: { ...p.ref, enabled: false }, loadResult: result }
                : p
            )
          );
          return;
        }

        toast.success(`Plugin "${name}" activado`);
        setPlugins((prev) =>
          prev.map((p) =>
            p.ref.id === id
              ? {
                  ...p,
                  ref: { ...p.ref, enabled: true },
                  loadResult: result ?? p.loadResult,
                }
              : p
          )
        );
      } else {
        // Desactivar en vivo
        await PluginManager.deactivate(id);
        toast.info(`Plugin "${name}" desactivado`);
        setPlugins((prev) =>
          prev.map((p) =>
            p.ref.id === id
              ? { ...p, ref: { ...p.ref, enabled: false } }
              : p
          )
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al ${nextEnabled ? "activar" : "desactivar"} "${name}"`, {
        description: msg,
      });
      // Revertir el estado visual — no mutamos nada, simplemente recargamos
      await loadPlugins();
    } finally {
      setTogglingId(null);
    }
  };

  // ── Desinstalar ───────────────────────────────────────────────────────────

  const handleUninstallConfirm = async () => {
    if (!pendingUninstall) return;

    const { id, name } = pendingUninstall;
    setIsUninstalling(true);

    try {
      // Desactivar primero si está activo
      if (PluginManager.isActive(id)) {
        await PluginManager.deactivate(id);
      }
      await source.uninstall(id);
      toast.success(`Plugin "${name}" desinstalado`);
      await loadPlugins();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al desinstalar "${name}"`, { description: msg });
    } finally {
      setIsUninstalling(false);
      setPendingUninstall(null);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderStatus = (row: PluginRow) => {
    const isActive = PluginManager.isActive(row.ref.id);
    const hasFailed =
      row.loadResult?.status === "failed" && row.ref.enabled;

    if (hasFailed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="gap-1 cursor-help">
                <XCircle className="h-3 w-3" />
                Error de carga
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              {row.loadResult?.error ?? "Error desconocido al cargar el plugin"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (isActive) {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Activo
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <PackageX className="h-3 w-3" />
        Inactivo
      </Badge>
    );
  };

  // ── Estados: loading / error / vacío ─────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive/60" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void loadPlugins()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Reintentar
        </Button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden bg-background">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Plugins instalados
            </span>
            <Badge variant="secondary" className="text-xs">
              {plugins.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => void loadPlugins()}
              title="Refrescar lista de plugins"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={() => void handleInstall()}
              disabled={installingId !== null}
            >
              {installingId !== null ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Instalando...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  Instalar plugin
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Lista ──────────────────────────────────────────────────────── */}
        {plugins.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">
              No hay plugins instalados
            </p>
            <p className="text-xs text-muted-foreground/60">
              Instalá tu primer plugin usando el botón de arriba
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {plugins.map((row) => {
              const isToggling = togglingId === row.ref.id;
              const hasFailed =
                row.loadResult?.status === "failed" && row.ref.enabled;

              return (
                <div
                  key={row.ref.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors",
                    isToggling && "opacity-60 pointer-events-none"
                  )}
                >
                  {/* Icono de estado */}
                  <div
                    className={cn(
                      "flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg",
                      hasFailed
                        ? "bg-destructive/10"
                        : row.ref.enabled
                          ? "bg-primary/10"
                          : "bg-muted"
                    )}
                  >
                    <Package
                      className={cn(
                        "h-4 w-4",
                        hasFailed
                          ? "text-destructive"
                          : row.ref.enabled
                            ? "text-primary"
                            : "text-muted-foreground"
                      )}
                    />
                  </div>

                  {/* Info del plugin */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {row.ref.name}
                      </span>
                      <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                        v{row.ref.version}
                      </code>
                      {renderStatus(row)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                      {row.ref.id}
                    </p>
                  </div>

                  {/* Toggle enabled */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isToggling ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        checked={row.ref.enabled}
                        onCheckedChange={(checked) =>
                          void handleToggle(row, checked)
                        }
                        aria-label={`${row.ref.enabled ? "Desactivar" : "Activar"} plugin ${row.ref.name}`}
                      />
                    )}

                    {/* Botón desinstalar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingUninstall(row.ref)}
                      title={`Desinstalar ${row.ref.name}`}
                      disabled={isToggling}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── AlertDialog de confirmación para desinstalar ────────────────────── */}
      <AlertDialog
        open={pendingUninstall !== null}
        onOpenChange={(open) => {
          if (!open) setPendingUninstall(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desinstalar plugin</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés desinstalar{" "}
              <strong>{pendingUninstall?.name}</strong>? Esta acción no se puede
              deshacer. El plugin se desactivará y eliminará del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUninstalling}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleUninstallConfirm()}
              disabled={isUninstalling}
            >
              {isUninstalling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Desinstalando...
                </>
              ) : (
                "Desinstalar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PluginSettings;
