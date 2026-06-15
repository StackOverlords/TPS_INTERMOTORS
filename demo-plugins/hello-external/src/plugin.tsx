/**
 * plugin.tsx — Tareas Demo (plugin externo TPS_INTERMOTORS).
 *
 * Expose principal de Module Federation: "./plugin"
 * El host lo carga con: loadRemote("helloExternal/plugin")
 *
 * APIs ejercitadas:
 *   registerRoutes, registerSidebarSection, registerSettingsAction,
 *   registerCommand, registerKeybinding,
 *   notify, confirm, prompt,
 *   getAuthState, getTheme,
 *   onEvent (+ unsubscribe), emitEvent,
 *   storage (get/set/delete/clear),
 *   hasCapability
 *
 * Estilo self-contained: <style id="dtp-styles"> inyectado en activate(),
 * removido en deactivate().
 */

import { definePlugin, CAPABILITY } from "@tps/plugin-sdk";
import type { PluginAPI } from "@tps/plugin-sdk";
import { createElement } from "react";
import type { ComponentType } from "react";
import { ClipboardListIcon, BarChart2Icon, SettingsIcon } from "lucide-react";

import { TasksScreen } from "./TasksScreen";
import { StatsScreen } from "./StatsScreen";
import { injectStyles, removeStyles } from "./styles";

// ---------------------------------------------------------------------------
// IDs estables — NO cambiar (el host reinstala por id)
// ---------------------------------------------------------------------------

const PLUGIN_ID = "com.tps.demo-external";

const CMD_OPEN = "demo-external.open";
const CMD_NEW_TASK = "demo-external.newTask";

const KB_OPEN = "demo-external.kb.open";
const KB_NEW_TASK = "demo-external.kb.newTask";

const ROUTE_TASKS = "demo-external.tasks";
const ROUTE_STATS = "demo-external.stats";
const SIDEBAR_SECTION_ID = "demo-external.sidebar";
const SETTINGS_ACTION_ID = "demo-external.settings";

const STORAGE_KEY = "tasks";
const EVENT_TASK_CREATED = "demoTasks.taskCreated";

// ---------------------------------------------------------------------------
// Closures de cleanup
// ---------------------------------------------------------------------------

// Unsubscribes que debemos llamar en deactivate()
let _unsubscribeEventListener: (() => void) | null = null;
// Guardamos el api para usarlo en settings actions y commands que no tienen closure directo
let _api: PluginAPI | null = null;

// ---------------------------------------------------------------------------
// Factories de componente de ruta (capturan api en closure)
// ---------------------------------------------------------------------------

/**
 * Crea el componente wrapper para TasksScreen con api inyectada.
 * El resultado tiene displayName para DevTools.
 */
function createTasksRoute(api: PluginAPI): ComponentType {
  const TasksViewRoute: ComponentType = () => createElement(TasksScreen, { api });
  TasksViewRoute.displayName = "DemoTasksViewRoute";
  return TasksViewRoute;
}

/**
 * Crea el componente wrapper para StatsScreen con api inyectada.
 */
function createStatsRoute(api: PluginAPI): ComponentType {
  const StatsViewRoute: ComponentType = () => createElement(StatsScreen, { api });
  StatsViewRoute.displayName = "DemoStatsViewRoute";
  return StatsViewRoute;
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

const plugin = definePlugin({
  manifest: {
    id: PLUGIN_ID,
    name: "Tareas Demo",
    version: "2.0.0",
    description:
      "Plugin demo externo — gestor de tareas que ejercita TODA la superficie del PluginAPI. Plantilla para el plugin de Facturación.",
    author: "TPS Dev",
    sdkVersion: "^0.1.0",
    requires: [
      CAPABILITY.VIEWS,
      CAPABILITY.NAVIGATION,
      CAPABILITY.COMMANDS,
      CAPABILITY.KEYBINDINGS,
      CAPABILITY.NOTIFICATIONS,
      CAPABILITY.SETTINGS,
      CAPABILITY.STORAGE,
      CAPABILITY.EVENTS,
    ],
  },

  activate(api: PluginAPI): void {
    _api = api;

    console.log("[tareas-demo] activating...");

    // ── 0. Inyectar estilos self-contained ──────────────────────────────────
    injectStyles();

    // ── 1. Crear componentes de ruta ────────────────────────────────────────
    const TasksViewRoute = createTasksRoute(api);
    const StatsViewRoute = createStatsRoute(api);

    // ── 2. Registrar rutas ──────────────────────────────────────────────────
    api.registerRoutes([
      {
        id: ROUTE_TASKS,
        path: "/demo/tareas",
        label: "Tareas",
        component: TasksViewRoute,
        icon: ClipboardListIcon,
        roles: [],
      },
      {
        id: ROUTE_STATS,
        path: "/demo/tareas/estadisticas",
        label: "Estadísticas",
        component: StatsViewRoute,
        icon: BarChart2Icon,
        roles: [],
      },
    ]);

    // ── 3. Registrar sección en sidebar ─────────────────────────────────────
    api.registerSidebarSection({
      id: SIDEBAR_SECTION_ID,
      label: "Demo Plugins",
      order: 998,
      icon: ClipboardListIcon,
      items: [
        {
          id: ROUTE_TASKS,
          path: "/demo/tareas",
          label: "Tareas",
          component: TasksViewRoute,
          icon: ClipboardListIcon,
          roles: [],
        },
        {
          id: ROUTE_STATS,
          path: "/demo/tareas/estadisticas",
          label: "Estadísticas",
          component: StatsViewRoute,
          icon: BarChart2Icon,
          roles: [],
        },
      ],
    });

    // ── 4. Registrar comandos ───────────────────────────────────────────────

    // Comando "abrir" — navega/notifica
    api.registerCommand(CMD_OPEN, () => {
      console.log("[tareas-demo] CMD_OPEN fired");
      api.notify("Tareas Demo activo — abrí el sidebar > Demo Plugins > Tareas", {
        variant: "info",
        description: "Usá Ctrl+Shift+N para crear una tarea rápida desde cualquier pantalla.",
      });
    });

    // Comando "nueva tarea rápida" — flujo completo de prompt desde cualquier pantalla
    api.registerCommand(CMD_NEW_TASK, async () => {
      console.log("[tareas-demo] CMD_NEW_TASK fired");

      const result = await api.prompt({
        title: "Tarea rápida",
        description: "Creá una tarea rápida sin salir de tu pantalla actual.",
        fields: [
          {
            id: "title",
            label: "¿Qué necesitás hacer?",
            type: "text",
            placeholder: "Título de la tarea",
            required: true,
          },
          {
            id: "priority",
            label: "Prioridad (alta / media / baja)",
            type: "text",
            placeholder: "media",
            defaultValue: "media",
          },
        ],
        confirmLabel: "Crear",
        cancelLabel: "Cancelar",
      });

      if (!result) return;

      const rawP = result.priority?.toLowerCase().trim();
      const priority =
        rawP === "alta" || rawP === "high"
          ? "high"
          : rawP === "baja" || rawP === "low"
          ? "low"
          : "med";

      const task = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        title: result.title.trim(),
        priority,
        done: false,
        createdAt: Date.now(),
      };

      // Leer tasks actuales, agregar y persistir
      const current = (await api.storage.get<unknown[]>(STORAGE_KEY)) ?? [];
      await api.storage.set(STORAGE_KEY, [task, ...current]);

      api.notify(`Tarea creada: "${task.title}"`, { variant: "success" });
      api.emitEvent(EVENT_TASK_CREATED, task);
    });

    // ── 5. Registrar keybindings ────────────────────────────────────────────
    api.registerKeybinding({
      id: KB_OPEN,
      key: "ctrl+shift+e",
      command: CMD_OPEN,
      description: "Tareas Demo: abrir plugin / ver instrucciones",
    });

    api.registerKeybinding({
      id: KB_NEW_TASK,
      key: "ctrl+shift+n",
      command: CMD_NEW_TASK,
      description: "Tareas Demo: crear nueva tarea rápida",
    });

    // ── 6. Registrar settings action con submenú ────────────────────────────
    api.registerSettingsAction({
      id: SETTINGS_ACTION_ID,
      label: "Tareas Demo",
      icon: SettingsIcon,
      submenu: [
        {
          id: `${SETTINGS_ACTION_ID}.export`,
          label: "Exportar tareas (log JSON)",
          onClick: async () => {
            if (!_api) return;
            const tasks = await _api.storage.get<unknown[]>(STORAGE_KEY);
            const json = JSON.stringify(tasks ?? [], null, 2);
            console.log("[tareas-demo] Export:", json);
            _api.notify("Tareas exportadas — ver consola del navegador (F12)", {
              variant: "info",
              description: `${(tasks ?? []).length} tarea(s) en JSON.`,
            });
          },
        },
        {
          id: `${SETTINGS_ACTION_ID}.clear`,
          label: "Borrar todas las tareas",
          onClick: async () => {
            if (!_api) return;
            const confirmed = await _api.confirm({
              title: "Borrar todas las tareas",
              message:
                "Se eliminarán TODAS las tareas permanentemente. Esta acción no se puede deshacer.",
              confirmLabel: "Borrar todo",
              cancelLabel: "Cancelar",
              destructive: true,
            });
            if (!confirmed) return;
            await _api.storage.delete(STORAGE_KEY);
            _api.notify("Todas las tareas eliminadas", { variant: "warning" });
          },
        },
      ],
    });

    // ── 7. Suscribir al bus de eventos ──────────────────────────────────────
    _unsubscribeEventListener = api.onEvent(EVENT_TASK_CREATED, (payload) => {
      console.log("[tareas-demo] Event received — taskCreated:", payload);
    });

    // ── 8. Log de capabilities opcionales ──────────────────────────────────
    const hasTabsCap = api.hasCapability(CAPABILITY.TABS);
    console.log(
      `[tareas-demo] hasCapability(TABS) = ${hasTabsCap} — omitido en requires (no requerido)`
    );

    console.log("[tareas-demo] activated — routes: /demo/tareas + /demo/tareas/estadisticas");
    console.log("[tareas-demo] keybindings: ctrl+shift+e (open), ctrl+shift+n (new task)");
    console.log("[tareas-demo] sidebar: Demo Plugins (order 998)");
  },

  deactivate(): void {
    console.log("[tareas-demo] deactivating...");

    // Desuscribir del bus de eventos (evita memory leaks)
    if (_unsubscribeEventListener) {
      _unsubscribeEventListener();
      _unsubscribeEventListener = null;
      console.log("[tareas-demo] unsubscribed from event bus");
    }

    // Limpiar referencia al api
    _api = null;

    // Remover estilos del DOM
    removeStyles();

    // El PluginManager limpia routes/sidebar/keybindings/commands/settingsActions automáticamente.
    console.log("[tareas-demo] deactivated — cleanup complete");
  },
});

export default plugin;
