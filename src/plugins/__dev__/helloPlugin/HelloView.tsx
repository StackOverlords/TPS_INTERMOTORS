/**
 * HelloView — Vista del plugin de prueba dev.
 *
 * Ejerce la API de plugins en tiempo de render:
 * - Muestra la tab activa via api.getActiveTab()
 * - Botón que dispara api.executeCommand("dev-hello.fire")
 * - Botón que abre api.confirm() y muestra el resultado
 * - Botón que abre api.prompt() y muestra los valores devueltos
 *
 * NO usa api.storage (Tauri IPC) para que funcione en browser/dev-server puro.
 */

import { useState } from "react";
import type { PluginAPI } from "@tps/plugin-sdk";

interface HelloViewProps {
  api: PluginAPI;
}

export function HelloView({ api }: HelloViewProps) {
  const activeTab = api.getActiveTab();
  const theme = api.getTheme();

  const [lastConfirm, setLastConfirm] = useState<boolean | null>(null);
  const [lastPrompt, setLastPrompt] = useState<Record<string, string> | null | "cancelled">(null);
  const [commandCount, setCommandCount] = useState(0);

  const handleFireCommand = async () => {
    await api.executeCommand("dev-hello.fire");
    setCommandCount((n) => n + 1);
  };

  const handleConfirm = async () => {
    const result = await api.confirm({
      title: "Dev Hello — Confirmación",
      message: "¿Querés confirmar esta acción de prueba?",
      confirmLabel: "Sí, confirmar",
      cancelLabel: "Cancelar",
      destructive: false,
    });
    setLastConfirm(result);
    console.log("[dev-hello] confirm result:", result);
    api.notify(
      result ? "Confirmaste la acción" : "Cancelaste la acción",
      { variant: result ? "success" : "warning" }
    );
  };

  const handlePrompt = async () => {
    const result = await api.prompt({
      title: "Dev Hello — Formulario",
      description: "Ingresá tus datos de prueba",
      fields: [
        {
          id: "nombre",
          label: "Nombre",
          type: "text",
          placeholder: "Tu nombre...",
          required: true,
        },
        {
          id: "notas",
          label: "Notas",
          type: "textarea",
          placeholder: "Notas opcionales...",
          required: false,
        },
      ],
      confirmLabel: "Enviar",
      cancelLabel: "Cancelar",
    });

    if (result === null) {
      setLastPrompt("cancelled");
      console.log("[dev-hello] prompt: cancelled");
    } else {
      setLastPrompt(result);
      console.log("[dev-hello] prompt result:", result);
      api.notify(`Hola, ${result["nombre"] ?? "desconocido"}!`, {
        variant: "success",
        description: result["notas"] ? `Notas: ${result["notas"]}` : undefined,
      });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Dev Hello Plugin</h1>
        <p className="text-sm text-muted-foreground">
          Plugin interno de prueba — valida Fase 3 del sistema de plugins.
        </p>
      </div>

      {/* Info del contexto */}
      <div className="rounded-lg border p-4 space-y-2 text-sm">
        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
          Contexto del host
        </p>
        <div className="grid grid-cols-2 gap-2">
          <span className="text-muted-foreground">Tema activo:</span>
          <span className="font-mono font-medium">{theme}</span>

          <span className="text-muted-foreground">Tab activa (routeId):</span>
          <span className="font-mono font-medium">
            {activeTab ? activeTab.routeId : "null (tab estática o sin tab)"}
          </span>

          <span className="text-muted-foreground">Tab activa (título):</span>
          <span className="font-mono font-medium">
            {activeTab ? activeTab.title : "—"}
          </span>

          <span className="text-muted-foreground">Tab activa (path):</span>
          <span className="font-mono font-medium">
            {activeTab ? activeTab.path : "—"}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="space-y-3">
        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
          Acciones de prueba
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleFireCommand}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Disparar comando (Ctrl+Shift+H)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            Abrir confirm()
          </button>

          <button
            type="button"
            onClick={handlePrompt}
            className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            Abrir prompt()
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="rounded-lg border p-4 space-y-2 text-sm">
        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
          Resultados
        </p>
        <div className="grid grid-cols-2 gap-2">
          <span className="text-muted-foreground">Comandos disparados:</span>
          <span className="font-mono font-medium">{commandCount}</span>

          <span className="text-muted-foreground">Último confirm():</span>
          <span className="font-mono font-medium">
            {lastConfirm === null ? "—" : String(lastConfirm)}
          </span>

          <span className="text-muted-foreground">Último prompt():</span>
          <span className="font-mono font-medium">
            {lastPrompt === null
              ? "—"
              : lastPrompt === "cancelled"
              ? "cancelado"
              : JSON.stringify(lastPrompt)}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Abrí la consola del browser para ver los logs de cada acción.
        El keybinding <kbd className="px-1 py-0.5 rounded border font-mono">Ctrl+Shift+H</kbd> también dispara el comando.
      </p>
    </div>
  );
}
