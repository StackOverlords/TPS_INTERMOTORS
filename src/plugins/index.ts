/**
 * Barrel de la capa de plugins de TPS.
 *
 * Fase 2: kernel (PluginManager + RouteRegistry).
 * Fase 3: hooks React para consumir el registry reactivamente (rutas, sidebar, settings).
 */

export { PluginManager, PluginManagerClass } from "./plugin-manager";
export { RouteRegistry } from "./core/route-registry";
export { useRegistryRoutes } from "./hooks/useRegistryRoutes";
export { usePluginSidebarSections } from "./hooks/usePluginSidebarSections";
export { usePluginSettingsActions } from "./hooks/usePluginSettingsActions";
