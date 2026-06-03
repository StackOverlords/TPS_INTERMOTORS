/**
 * RouteRegistry — Registro runtime de rutas de plugins.
 *
 * Infraestructura AISLADA: ningún componente de producción la consume todavía.
 * La integración con Navigation.tsx y appSidebar.tsx se hace en Fase 3 (cableado aditivo).
 *
 * Portado desde excalidraw-app/src/core/routing/route-registry.ts.
 * Adaptado para consumir el tipo `RouteConfig` de @tps/plugin-sdk (no el de excalidraw).
 *
 * Diferencias respecto a la base de excalidraw:
 * - Usa `RouteConfig` del SDK en lugar del tipo local de excalidraw.
 * - No tiene `subRoutes` recursivos (RouteConfig del SDK no los define).
 * - Se agregó `unregister(id)` (pedido explícito, estaba en excalidraw también).
 * - Se eliminó `getTopLevel()`, `search()`, `getRouteByPath()` — fuera de alcance Fase 2.
 *   Serán necesarios en Fase 3 cuando Navigation/sidebar consuma el registry.
 */

import type { RouteConfig } from "@tps/plugin-sdk";

/**
 * Registro runtime de rutas aportadas por plugins.
 *
 * El RouteRegistry es un Map simple: id → RouteConfig.
 * No impone ningún ordenamiento ni jerarquía; eso lo decide la UI consumidora
 * (Navigation.tsx y appSidebar.tsx, en Fase 3).
 *
 * Ciclo de vida:
 *   1. El PluginManager llama a `register(routes)` durante `activate(pluginId)`.
 *   2. El PluginManager llama a `unregister(id)` por cada ruta durante `deactivate(pluginId)`.
 *   3. Fase 3: Navigation y Sidebar suscriben a cambios del registry para re-renderizar.
 */
class RouteRegistryClass {
  /** Mapa principal: routeId → RouteConfig */
  private readonly routes: Map<string, RouteConfig> = new Map();

  /**
   * Caché de la lista plana de rutas.
   * Se invalida cada vez que el registry se modifica (register/unregister/clear).
   */
  private flatCache: RouteConfig[] | null = null;

  /**
   * Registra un array de rutas en el registry.
   * Si una ruta con el mismo `id` ya existe, la sobreescribe (update semantics).
   *
   * @param routes - Array de RouteConfig aportadas por el plugin.
   */
  register(routes: RouteConfig[]): void {
    this.flatCache = null;
    for (const route of routes) {
      this.routes.set(route.id, route);
    }
  }

  /**
   * Desregistra una ruta por su `id`.
   * No-op si la ruta no existe (seguro llamarlo durante cleanup).
   *
   * @param id - El `routeId` a eliminar.
   */
  unregister(id: string): void {
    if (!this.routes.has(id)) return;
    this.routes.delete(id);
    this.flatCache = null;
  }

  /**
   * Retorna la RouteConfig de una ruta por su `id`.
   * Retorna `undefined` si la ruta no está registrada.
   *
   * @param id - El `routeId` a buscar.
   */
  getRoute(id: string): RouteConfig | undefined {
    return this.routes.get(id);
  }

  /**
   * Retorna todas las rutas registradas como array plano.
   * El resultado está cacheado — es barato llamarlo en cada render.
   * El cache se invalida automáticamente en register/unregister/clear.
   */
  getAllRoutes(): RouteConfig[] {
    if (this.flatCache) return this.flatCache;
    this.flatCache = Array.from(this.routes.values());
    return this.flatCache;
  }

  /**
   * Limpia todas las rutas registradas.
   * Usado principalmente en tests o al reinicializar el sistema.
   */
  clear(): void {
    this.routes.clear();
    this.flatCache = null;
  }
}

/**
 * Singleton del RouteRegistry.
 * Exportado como singleton para que PluginManager y (en Fase 3) Navigation lo compartan.
 */
export const RouteRegistry = new RouteRegistryClass();
