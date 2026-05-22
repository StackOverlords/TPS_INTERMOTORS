import { useState, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  Save,
  Database,
  Info,
  Play,
  FileArchive,
  ChevronLeft,
  ChevronRight,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Label } from "@/components/atoms/label";
import { useBackupSettings } from "../../hooks/backup/useBackupSettings";
import { useUpdateBackupSettings } from "../../hooks/backup/useUpdateBackupSettings";
import { useRunBackup } from "../../hooks/backup/useRunBackup";
import { useFetchBackups } from "../../hooks/backup/useFetchBackups";
import {
  FREQUENCY_OPTIONS,
  RETENTION_OPTIONS,
  getFrequencyFromCron,
  getHourFromCron,
  updateCronHour,
} from "../../utils/cronHelper";

const BackupSettings = () => {
  const { data: settings, isLoading } = useBackupSettings();
  const { mutate: updateSettings, isPending } = useUpdateBackupSettings();
  const { mutate: runBackupMutation, isPending: isRunning } = useRunBackup();

  const [frequency, setFrequency] =
    useState<keyof typeof FREQUENCY_OPTIONS>("daily");
  const [hour, setHour] = useState("04:00");
  const [retention, setRetention] = useState(30);
  const [currentCron, setCurrentCron] = useState("0 4 * * *");
  const [page, setPage] = useState(1);

  const { data: backupsData, isLoading: isLoadingFiles } = useFetchBackups(page, 10);

  useEffect(() => {
    if (settings) {
      const freq = getFrequencyFromCron(settings.cron_expression);
      if (freq !== "custom") setFrequency(freq);
      setHour(getHourFromCron(settings.cron_expression));
      setRetention(settings.retention_days);
      setCurrentCron(settings.cron_expression);
    }
  }, [settings]);

  const handleFrequencyChange = (value: string) => {
    const freq = value as keyof typeof FREQUENCY_OPTIONS;
    setFrequency(freq);
    setCurrentCron(updateCronHour(FREQUENCY_OPTIONS[freq].cron, hour));
  };

  const handleHourChange = (value: string) => {
    setHour(value);
    setCurrentCron(updateCronHour(FREQUENCY_OPTIONS[frequency].cron, value));
  };

  const hasChanges =
    settings &&
    (currentCron !== settings.cron_expression || retention !== settings.retention_days);

  const totalPages = backupsData?.meta?.last_page ?? 1;
  const totalFiles = backupsData?.meta?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Respaldos de Base de Datos</span>
          {hasChanges && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
              Sin guardar
            </span>
          )}
        </div>
        <Button
          onClick={() => runBackupMutation()}
          disabled={isRunning}
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs"
        >
          {isRunning
            ? <><Loader2 className="h-3 w-3 animate-spin" /> Iniciando...</>
            : <><Play className="h-3 w-3" /> Ejecutar backup</>
          }
        </Button>
      </div>

      {/* ── Body: config + archivos ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

        {/* Columna izquierda — configuración */}
        <div className="p-4 space-y-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Programación
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Frecuencia</Label>
              <Select value={frequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Cada hora</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hora</Label>
                <Select value={hour} onValueChange={handleHourChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01:00">1:00 AM</SelectItem>
                    <SelectItem value="02:00">2:00 AM</SelectItem>
                    <SelectItem value="03:00">3:00 AM</SelectItem>
                    <SelectItem value="04:00">4:00 AM</SelectItem>
                    <SelectItem value="05:00">5:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Retención</Label>
                <Select
                  value={retention.toString()}
                  onValueChange={(v) => setRetention(Number(v))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETENTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cron generado */}
          <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Expresión cron
                </span>
              </div>
              <code className="text-xs font-mono text-foreground bg-background px-2 py-0.5 rounded border border-border">
                {currentCron}
              </code>
            </div>
            <div className="flex items-start gap-1.5">
              <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Backups mayores de <strong>{retention} días</strong> se eliminan automáticamente
              </p>
            </div>
          </div>

          <Button
            onClick={() => updateSettings({ cron: currentCron, dias_retencion: retention })}
            disabled={!hasChanges || isPending}
            size="sm"
            className="w-full gap-2"
          >
            {isPending
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
              : <><Save className="h-3.5 w-3.5" /> {hasChanges ? "Guardar cambios" : "Sin cambios"}</>
            }
          </Button>
        </div>

        {/* Columna derecha — archivos */}
        <div className="flex flex-col">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileArchive className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Archivos almacenados
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {totalFiles} archivo{totalFiles !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 flex flex-col">
            {isLoadingFiles ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !backupsData?.data?.length ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <HardDrive className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">Sin archivos disponibles</p>
                <p className="text-[10px] text-muted-foreground/60">
                  Ejecutá un backup para ver los archivos aquí
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border flex-1">
                {backupsData.data.map((file) => (
                  <div
                    key={file.nombre}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <FileArchive className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-foreground truncate">{file.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">{file.fecha_creacion}</p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground shrink-0 tabular-nums">
                      {file.tamanio}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-4 py-2 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-default"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-default"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;
