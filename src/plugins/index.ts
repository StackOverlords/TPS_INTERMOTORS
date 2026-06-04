/**
 * Barrel de la capa de plugins de TPS.
 *
 * Fase 2: kernel (PluginManager + RouteRegistry).
 * Fase 3: hooks React para consumir el registry reactivamente (rutas, sidebar, settings).
 * Fase 4: loader de plugins externos (loadExternalPlugins + PluginSource abstraction).
 */

export { PluginManager, PluginManagerClass } from "./plugin-manager";
export { RouteRegistry } from "./core/route-registry";
export { useRegistryRoutes } from "./hooks/useRegistryRoutes";
export { usePluginSidebarSections } from "./hooks/usePluginSidebarSections";
export { usePluginSettingsActions } from "./hooks/usePluginSettingsActions";

// Fase 4: loader de plugins externos + abstracción de fuente
export { loadExternalPlugins } from "./loadExternalPlugins";
export type { LoadResult } from "./loadExternalPlugins";
export type { PluginSource, ExternalPluginRef } from "./sources/PluginSource";
export { TauriPluginSource } from "./sources/TauriPluginSource";
export {
  setBootstrapLoadResults,
  getBootstrapLoadResults,
} from "./bootstrapLoadResults";
