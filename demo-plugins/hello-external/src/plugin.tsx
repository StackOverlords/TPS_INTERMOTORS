/**
 * plugin.tsx — Entry point del plugin externo Hello External.
 *
 * Este módulo es el expose "./plugin" de Module Federation.
 * El host lo carga con: loadRemote("helloExternal/plugin")
 *
 * Contrato: default export = Plugin (validado por definePlugin del SDK).
 * Replica la estructura de helloPlugin interno (Fase 3) con IDs distintos
 * para no colisionar con el plugin dev interno.
 *
 * CAPSULAS:
 * - Route: /demo/external (id: "demo-external.view")
 * - Sidebar: sección "Demo Plugins" (orden 998)
 * - Command: "demo-external.fire"
 * - Keybinding: Ctrl+Shift+E → demo-external.fire
 * - Notifications: via api.notify()
 */

import { definePlugin, CAPABILITY } from "@tps/plugin-sdk";
import type { PluginAPI } from "@tps/plugin-sdk";
import { HelloView } from "./HelloView";
import { createElement } from "react";

// ---------------------------------------------------------------------------
// Constantes de IDs — prefijo "demo-external" para no colisionar con "dev-hello"
// ---------------------------------------------------------------------------

const PLUGIN_ID = "com.tps.demo-external";
const COMMAND_ID = "demo-external.fire";
const KEYBINDING_ID = "demo-external.kb";
const ROUTE_ID = "demo-external.view";
const SIDEBAR_SECTION_ID = "demo-external.sidebar";

// ---------------------------------------------------------------------------
// Factory del componente de ruta (captura api en closure)
// ---------------------------------------------------------------------------

/**
 * Crea el componente de ruta con api inyectada.
 * HelloView es standalone (no necesita api) pero mantenemos el patrón
 * por consistencia con el plugin interno y extensibilidad futura.
 */
function createHelloViewRoute(_api: PluginAPI): () => React.ReactElement {
  return function HelloViewRoute() {
    return createElement(HelloView);
  };
}

// ---------------------------------------------------------------------------
// Plugin definition — default export (Module Federation consume el default)
// ---------------------------------------------------------------------------

const plugin = definePlugin({
  manifest: {
    id: PLUGIN_ID,
    name: "Hello External",
    version: "1.0.0",
    description: "Plugin demo externo — valida instalación end-to-end del sistema de plugins (Fase 5).",
    author: "TPS Dev",
    sdkVersion: "^0.1.0",
    requires: [
      CAPABILITY.VIEWS,
      CAPABILITY.NAVIGATION,
      CAPABILITY.COMMANDS,
      CAPABILITY.KEYBINDINGS,
      CAPABILITY.NOTIFICATIONS,
    ],
  },

  activate(api: PluginAPI): void {
    // ── 1. Registrar comando ────────────────────────────────────────────────
    api.registerCommand(COMMAND_ID, () => {
      console.log("[hello-external] command fired");
      api.notify("Hello External: plugin externo activo!", {
        variant: "success",
        description: "El plugin demo externo está funcionando correctamente.",
      });
    });

    // ── 2. Registrar ruta ───────────────────────────────────────────────────
    const HelloViewRoute = createHelloViewRoute(api);
    HelloViewRoute.displayName = "HelloExternalViewRoute";

    api.registerRoutes([
      {
        id: ROUTE_ID,
        path: "/demo/external",
        label: "Hello External",
        component: HelloViewRoute,
        roles: [], // acceso público — sin filtro de rol
      },
    ]);

    // ── 3. Registrar sección en sidebar ─────────────────────────────────────
    // Orden 998 → antes del plugin dev interno (999), después de secciones nativas.
    api.registerSidebarSection({
      id: SIDEBAR_SECTION_ID,
      label: "Demo Plugins",
      order: 998,
      items: [
        {
          id: ROUTE_ID,
          path: "/demo/external",
          label: "Hello External",
          component: HelloViewRoute,
          roles: [],
        },
      ],
    });

    // ── 4. Registrar keybinding ─────────────────────────────────────────────
    api.registerKeybinding({
      id: KEYBINDING_ID,
      key: "ctrl+shift+e",
      command: COMMAND_ID,
      description: "Hello External: abrir vista del plugin demo externo",
    });

    console.log("[hello-external] plugin activated — Fase 5 validation plugin");
    console.log("[hello-external] route: /demo/external");
    console.log("[hello-external] keybinding: ctrl+shift+e → demo-external.fire");
    console.log("[hello-external] sidebar section: Demo Plugins (order: 998)");
  },

  deactivate(): void {
    // El PluginManager limpia routes/sidebar/keybindings automáticamente.
    // Este log confirma que deactivate() fue llamado correctamente.
    console.log("[hello-external] plugin deactivated — cleanup complete");
  },
});

export default plugin;
