/**
 * RouteRegistry — Registro runtime de rutas de plugins.
 *
 * Portado desde excalidraw-app/src/core/routing/route-registry.ts.
 * Adaptado para consumir el tipo `RouteConfig` de @tps/plugin-sdk (no el de excalidraw).
 *
 * Diferencias respecto a la base de excalidraw:
 * - Usa `RouteConfig` del SDK en lugar del tipo local de excalidraw.
 * - No tiene `subRoutes` recursivos (RouteConfig del SDK no los define).
 * - Se agregó `unregister(id)` (pedido explícito, estaba en excalidraw también).
 * - Fase 3: Se agregó `subscribe(listener)` para reactividad con useSyncExternalStore.
 *
 * Decisión sobre suscripción propia vs. reusar PluginManager.subscribe:
 *   PluginManager.subscribe espera `(event: ManagerEvent) => void` — no es compatible
 *   con la firma `() => void` que requiere useSyncExternalStore sin un adaptador extra.
 *   Además, acoplar el registry al PluginManager crearía dependencia circular
 *   (PluginManager ya importa RouteRegistry). El registry tiene su propio bus de listeners
 *   de tipo `() => void` — simple, desacoplado, correcto.
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
 *   3. Navigation y Sidebar suscriben a cambios del registry via `subscribe()` para re-renderizar.
 */
class RouteRegistryClass {
  /** Mapa principal: routeId → RouteConfig */
  private readonly routes: Map<string, RouteConfig> = new Map();

  /**
   * Caché de la lista plana de rutas.
   * Se invalida cada vez que el registry se modifica (register/unregister/clear).
   * useSyncExternalStore exige referencia estable mientras no hay mutación —
   * esta caché garantiza exactamente eso.
   */
  private flatCache: RouteConfig[] | null = null;

  /**
   * Bus de listeners para suscripciones reactivas.
   * Compatible con la firma `() => void` de useSyncExternalStore.
   */
  private readonly listeners: Set<() => void> = new Set();

  // ── Suscripción reactiva ─────────────────────────────────────────────────

  /**
   * Suscribe un listener que se invoca cada vez que el registry muta
   * (register / unregister / clear).
   *
   * Compatible directamente con useSyncExternalStore — devuelve la función
   * de desuscripción que React llama en cleanup.
   *
   * @param listener - Función sin argumentos invocada en cada mutación.
   * @returns Función de desuscripción.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Notifica a todos los listeners suscritos. Llamado internamente en cada mutación. */
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // ── API pública ──────────────────────────────────────────────────────────

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
    this.notify();
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
    this.notify();
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
   * Busca una ruta por su `path` exacto y retorna la RouteConfig correspondiente.
   * Retorna `undefined` si ninguna ruta registrada tiene ese path.
   *
   * Uso principal: resolver el `routeId` de una tab recién creada para anotarla
   * con `routeId` cuando su path coincide con una ruta de plugin.
   * Las tabs estáticas (no en el registry) retornan `undefined` — sin efecto secundario.
   *
   * Complejidad: O(n) sobre rutas de plugin — en la práctica n es pequeño (<50).
   * No necesita caché separada: el mapa ya es eficiente para lookup por id;
   * el lookup por path es infrecuente (solo al crear una tab nueva).
   *
   * @param path - El segmento de URL a buscar. Ej: "/facturacion/facturas"
   * @returns RouteConfig si se encuentra, `undefined` si no hay match.
   */
  getRouteByPath(path: string): RouteConfig | undefined {
    for (const route of this.routes.values()) {
      if (route.path === path) return route;
    }
    return undefined;
  }

  /**
   * Retorna todas las rutas registradas como array plano.
   * El resultado está cacheado — es barato llamarlo en cada render.
   * El cache se invalida automáticamente en register/unregister/clear.
   *
   * Identidad estable: devuelve la MISMA referencia de array mientras no
   * haya mutación. Esto es requerido por useSyncExternalStore para evitar
   * loops de re-render infinitos.
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
    this.notify();
  }
}

/**
 * Singleton del RouteRegistry.
 * Exportado como singleton para que PluginManager y Navigation lo compartan.
 */
export const RouteRegistry = new RouteRegistryClass();
