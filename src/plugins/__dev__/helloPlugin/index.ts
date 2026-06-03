/**
 * helloPlugin — Plugin interno de prueba para validar Fase 3 del sistema de plugins.
 *
 * ÚNICAMENTE para uso en desarrollo (dev-only). Nunca se activa en producción.
 * Se carga a través de bootstrapDevPlugins() cuando VITE_DEV_PLUGINS=1.
 *
 * Ejercita TODO el surface de PluginAPI de Fase 3:
 * - registerRoutes
 * - registerSidebarSection
 * - registerCommand + executeCommand
 * - registerKeybinding (ctrl+shift+h)
 * - registerSettingsAction
 * - notify, confirm, prompt
 * - getActiveTab (lazo de tabs)
 * - getTheme, getAuthState
 */

import { definePlugin, CAPABILITY } from "@tps/plugin-sdk";
import type { PluginAPI } from "@tps/plugin-sdk";
import { Terminal } from "lucide-react";
import { createElement } from "react";
import { HelloView } from "./HelloView";

/** ID canónico del plugin — reverse-DNS, prefijo dev para aislamiento semántico. */
const PLUGIN_ID = "dev.tps.hello";

/** ID del comando principal del plugin. */
const COMMAND_ID = "dev-hello.fire";

/** ID del keybinding del plugin. */
const KEYBINDING_ID = "dev-hello.keybinding.fire";

/** ID de la ruta del plugin. */
const ROUTE_ID = "dev-hello.view";

/** ID de la sección del sidebar del plugin. */
const SIDEBAR_SECTION_ID = "dev-hello.sidebar";

/** ID de la settings action del plugin. */
const SETTINGS_ACTION_ID = "dev-hello.settings-action";

/**
 * Referencia a la API del plugin, guardada durante activate() para el componente HelloView.
 * Necesaria porque HelloView necesita api.confirm(), api.prompt(), etc. en sus handlers.
 * En un plugin real esto se haría con un contexto React — aquí lo simplificamos para dev.
 */
let _api: PluginAPI | null = null;

/** Retorna la api guardada. El componente HelloView la recibe como prop. */
export function getDevHelloApi(): PluginAPI | null {
  return _api;
}

// ---------------------------------------------------------------------------
// Fábrica del componente de ruta (captura api en closure en activate())
// ---------------------------------------------------------------------------

/**
 * Crea el componente de la vista con la api inyectada.
 * Retorna un ComponentType sin props (como requiere RouteConfig.component).
 */
function createHelloViewComponent(api: PluginAPI): () => React.ReactElement {
  return function HelloViewRoute() {
    return createElement(HelloView, { api });
  };
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

export const helloPlugin = definePlugin({
  manifest: {
    id: PLUGIN_ID,
    name: "Dev Hello Plugin",
    version: "0.1.0",
    description: "Plugin de prueba interno — valida el surface completo de Fase 3.",
    author: "TPS Dev",
    sdkVersion: "^0.1.0",
    requires: [
      CAPABILITY.VIEWS,
      CAPABILITY.NAVIGATION,
      CAPABILITY.SETTINGS,
      CAPABILITY.NOTIFICATIONS,
      CAPABILITY.COMMANDS,
      CAPABILITY.KEYBINDINGS,
      CAPABILITY.TABS,
    ],
  },

  activate(api: PluginAPI): void {
    // Guardar referencia para HelloView
    _api = api;

    // ── 1. Registrar comando ────────────────────────────────────────────────
    api.registerCommand(COMMAND_ID, () => {
      console.log("[dev-hello] command fired");
      api.notify("Dev Hello: comando disparado!", {
        variant: "info",
        description: `Tema activo: ${api.getTheme()} | Auth: ${api.getAuthState().isAuthenticated ? "autenticado" : "anónimo"}`,
      });
    });

    // ── 2. Registrar ruta ───────────────────────────────────────────────────
    // roles: [] → acceso público (hasRouteAccess retorna true si roles está vacío).
    // El componente captura `api` en closure para no depender de contexto global.
    const HelloViewComponent = createHelloViewComponent(api);
    // Necesitamos darle displayName para debuggear en React DevTools
    HelloViewComponent.displayName = "HelloViewRoute";

    api.registerRoutes([
      {
        id: ROUTE_ID,
        path: "/dev/hello",
        label: "Dev Hello",
        component: HelloViewComponent,
        icon: Terminal,
        roles: [], // vacío = acceso público, sin filtro de rol
      },
    ]);

    // ── 3. Registrar sección en sidebar ─────────────────────────────────────
    // Orden 999 → aparece al final, después de secciones nativas (múltiplos de 100).
    api.registerSidebarSection({
      id: SIDEBAR_SECTION_ID,
      label: "Dev Plugins",
      order: 999,
      icon: Terminal,
      items: [
        {
          id: ROUTE_ID,
          path: "/dev/hello",
          label: "Dev Hello",
          component: HelloViewComponent,
          icon: Terminal,
          roles: [],
        },
      ],
    });

    // ── 4. Registrar keybinding ─────────────────────────────────────────────
    // Dispara COMMAND_ID cuando el usuario presiona ctrl+shift+h.
    // El kernel crea el handler como () => executeCommand(COMMAND_ID).
    api.registerKeybinding({
      id: KEYBINDING_ID,
      key: "ctrl+shift+h",
      command: COMMAND_ID,
      description: "Dev Hello: disparar comando de prueba",
    });

    // ── 5. Registrar settings action ────────────────────────────────────────
    // Aparece en el panel de configuración del sidebar footer.
    // onClick abre confirm() y luego prompt() para ejercitar ambos diálogos.
    api.registerSettingsAction({
      id: SETTINGS_ACTION_ID,
      label: "Dev Hello — Ajustes",
      icon: Terminal,
      onClick: () => {
        // Disparar async sin await (onClick es síncrono en el contrato)
        void (async () => {
          const confirmed = await api.confirm({
            title: "Dev Hello Plugin",
            message: "¿Querés abrir el formulario de prueba?",
            confirmLabel: "Sí, abrir",
            cancelLabel: "Cancelar",
          });
          console.log("[dev-hello] settings action confirm:", confirmed);
          api.notify(
            confirmed ? "Abriendo formulario..." : "Acción cancelada",
            { variant: confirmed ? "info" : "warning" }
          );

          if (confirmed) {
            const result = await api.prompt({
              title: "Dev Hello — Config",
              description: "Configuración de prueba del plugin",
              fields: [
                {
                  id: "parametro",
                  label: "Parámetro de prueba",
                  type: "text",
                  placeholder: "Ingresá un valor...",
                  required: false,
                },
              ],
              confirmLabel: "Guardar",
              cancelLabel: "Cancelar",
            });
            console.log("[dev-hello] settings action prompt result:", result);
            if (result !== null) {
              api.notify(`Valor guardado: ${result["parametro"] ?? "(vacío)"}`, {
                variant: "success",
              });
            }
          }
        })();
      },
    });

    console.log("[dev-hello] plugin activated — all Phase 3 APIs exercised");
    console.log("[dev-hello] route: /dev/hello");
    console.log("[dev-hello] keybinding: ctrl+shift+h → dev-hello.fire");
    console.log("[dev-hello] sidebar section: Dev Plugins");
    console.log("[dev-hello] settings action: Dev Hello — Ajustes");
  },

  deactivate(): void {
    _api = null;
    console.log("[dev-hello] plugin deactivated — cleanup complete");
  },
});
