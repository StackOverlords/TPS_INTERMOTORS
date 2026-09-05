/**
 * @tps/plugin-sdk
 *
 * Paquete de contrato del sistema de plugins de TPS_INTERMOTORS.
 * Solo tipos + helper definePlugin(). Cero runtime, cero side-effects.
 *
 * Uso desde un plugin externo:
 * ```ts
 * import { definePlugin, type Plugin, type PluginAPI } from "@tps/plugin-sdk";
 * ```
 */

// Re-exportar todo el contrato
export type {
  PluginTarget,
  // Tipos fundamentales
  Capability,
  Plugin,
  PluginManifest,
  PluginAPI,

  // Tipos de soporte para PluginAPI
  RouteConfig,
  IconProps,
  TabRouteConfig,
  SidebarSection,
  SettingsAction,
  SettingsActionItem,
  CommandHandler,
  PluginEventHandler,
  Disposable,

  // Notificaciones / diálogos
  NotifyOptions,
  ConfirmOptions,
  PromptOptions,
  PromptField,
  PromptResult,

  // Auth
  AuthState,
  AuthUser,

  // Tabs
  ActiveTabInfo,

  // Keybindings
  KeybindingDeclaration,

  // Storage
  PluginStorageAPI,
} from "./types.js";

// Re-exportar la constante de capabilities (valor de runtime, útil en manifiestos)
export { CAPABILITY } from "./types.js";

// ---------------------------------------------------------------------------
// definePlugin — helper de tipado
// ---------------------------------------------------------------------------

import type { Plugin } from "./types.js";

/**
 * Helper de tipado para definir un plugin con autocompletado completo.
 * No hace nada en runtime — es una función identidad que ayuda a TypeScript
 * a inferir los tipos del manifiesto y los callbacks.
 *
 * @example
 * ```ts
 * import { definePlugin, CAPABILITY } from "@tps/plugin-sdk";
 *
 * export default definePlugin({
 *   manifest: {
 *     id: "com.rhleone.facturacion",
 *     name: "Facturación",
 *     version: "1.0.0",
 *     sdkVersion: "^0.1.0",
 *     requires: [CAPABILITY.VIEWS, CAPABILITY.STORAGE],
 *   },
 *   activate(api) {
 *     // api está completamente tipado como PluginAPI
 *   },
 * });
 * ```
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}
