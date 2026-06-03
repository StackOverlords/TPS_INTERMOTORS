/**
 * Barrel de la capa de plugins de TPS.
 *
 * Fase 2: expone el kernel (PluginManager + RouteRegistry).
 * Fase 3 agregará: hooks React, loaders (interno/externo), etc.
 */

export { PluginManager, PluginManagerClass } from "./plugin-manager";
export { RouteRegistry } from "./core/route-registry";
