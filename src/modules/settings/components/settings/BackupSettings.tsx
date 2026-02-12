import { useState, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  Save,
  Clock,
  Database,
  Calendar,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Label } from "@/components/atoms/label";
import { Separator } from "@/components/atoms/separator";
import { useBackupSettings } from "../../hooks/backup/useBackupSettings";
import { useUpdateBackupSettings } from "../../hooks/backup/useUpdateBackupSettings";
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

  const [frequency, setFrequency] =
    useState<keyof typeof FREQUENCY_OPTIONS>("daily");
  const [hour, setHour] = useState("04:00");
  const [retention, setRetention] = useState(30);
  const [currentCron, setCurrentCron] = useState("0 4 * * *");

  // Sincronizar con datos del servidor
  useEffect(() => {
    if (settings) {
      const freq = getFrequencyFromCron(settings.cron_expression);
      if (freq !== "custom") {
        setFrequency(freq);
      }
      setHour(getHourFromCron(settings.cron_expression));
      setRetention(settings.retention_days);
      setCurrentCron(settings.cron_expression);
    }
  }, [settings]);

  const handleFrequencyChange = (value: string) => {
    const freq = value as keyof typeof FREQUENCY_OPTIONS;
    setFrequency(freq);
    const newCron = updateCronHour(FREQUENCY_OPTIONS[freq].cron, hour);
    setCurrentCron(newCron);
  };

  const handleHourChange = (value: string) => {
    setHour(value);
    const newCron = updateCronHour(FREQUENCY_OPTIONS[frequency].cron, value);
    setCurrentCron(newCron);
  };

  const handleRetentionChange = (value: string) => {
    setRetention(Number(value));
  };

  const handleSave = () => {
    updateSettings({
      cron: currentCron,
      dias_retencion: retention,
    });
  };

  // Verificar si hay cambios
  const hasChanges =
    settings &&
    (currentCron !== settings.cron_expression ||
      retention !== settings.retention_days);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Cargando configuración...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-100 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-900">
        <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-500/50">
          <Database className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            Respaldos Automáticos de Base de Datos
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Los backups se ejecutan automáticamente según la configuración
            programada
          </p>
        </div>
        {hasChanges && (
          <Badge className="bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/50 animate-pulse">
            Cambios sin guardar
          </Badge>
        )}
      </div>

      {/* Configuration Card */}
      <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Configuración de Programación</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Define cuándo y por cuánto tiempo mantener los respaldos
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {/* Frequency & Time Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4" />
              Programación de Ejecución
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Frecuencia
                </Label>
                <Select value={frequency} onValueChange={handleFrequencyChange}>
                  <SelectTrigger className="transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">⚡ Cada hora</SelectItem>
                    <SelectItem value="daily">📅 Diario</SelectItem>
                    <SelectItem value="weekly">📆 Semanal</SelectItem>
                    <SelectItem value="monthly">🗓️ Mensual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {FREQUENCY_OPTIONS[frequency].label}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Hora de Ejecución
                </Label>
                <Select value={hour} onValueChange={handleHourChange}>
                  <SelectTrigger className="transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01:00">🌙 1:00 AM</SelectItem>
                    <SelectItem value="02:00">🌙 2:00 AM</SelectItem>
                    <SelectItem value="03:00">🌙 3:00 AM</SelectItem>
                    <SelectItem value="04:00">🌙 4:00 AM</SelectItem>
                    <SelectItem value="05:00">🌅 5:00 AM</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hora de menor actividad recomendada
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Retention Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Database className="h-4 w-4" />
              Gestión de Almacenamiento
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Período de Retención
              </Label>
              <Select
                value={retention.toString()}
                onValueChange={handleRetentionChange}
              >
                <SelectTrigger className="transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/25 border border-amber-100 dark:border-amber-500/40">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Los backups más antiguos de <strong>{retention} días</strong>{" "}
                  se eliminarán automáticamente para liberar espacio
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cron Expression & Save */}
          <div className="space-y-2">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Expresión Cron Generada
                  </p>
                  <code className="text-sm font-mono text-foreground bg-background px-2.5 py-1.5 rounded border border-border inline-block">
                    {currentCron}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta expresión define la programación exacta del backup
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!hasChanges || isPending}
              className="w-full h-11 gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando configuración...
                </>
              ) : hasChanges ? (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Configuración Guardada
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TODO: Secciones deshabilitadas temporalmente - Sin endpoints disponibles */}
      {/*
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Estado de Respaldos
                    </CardTitle>
                    <CardDescription>
                        Información sobre el último respaldo y estado actual
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-100">
                                <HardDrive className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-green-800">Último respaldo exitoso</p>
                                <p className="text-sm text-green-600">Hoy a las 3:00 AM</p>
                            </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Completo</Badge>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Respaldo Manual
                    </CardTitle>
                    <CardDescription>
                        Crear un respaldo inmediato de tus datos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Crear respaldo completo
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Restaurar Datos
                    </CardTitle>
                    <CardDescription>
                        Restaura tus datos desde un respaldo anterior
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Funcionalidad en desarrollo</p>
                </CardContent>
            </Card>
            */}
    </div>
  );
};

export default BackupSettings;
