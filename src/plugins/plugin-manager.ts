/**
 * PluginManager — Kernel del sistema de plugins de TPS_INTERMOTORS.
 *
 * Portado desde excalidraw-app/src/plugins/plugin-manager.ts.
 * Adaptado para consumir los tipos de @tps/plugin-sdk y los servicios del host TPS.
 *
 * FASE 2: Infraestructura kernel aislada.
 * - RouteRegistry: CABLEADO (escribe rutas en el registry de Fase 2).
 * - SidebarSections: CABLEADO (en memoria; la UI lo leerá en Fase 3).
 * - SettingsActions: CABLEADO (en memoria; la UI lo leerá en Fase 3).
 * - Comandos: CABLEADO (en memoria).
 * - Eventos (pub/sub): CABLEADO (bus interno completo).
 * - notify/confirm/prompt: STUB seguro → TODO Fase 3 (cablear a sonner/dialog del host).
 * - getAuthState: CABLEADO → lee authSDK.getState() / authSDK.getCurrentUser().
 * - getActiveTab/onTabChange: STUB seguro → TODO Fase 3 (cablear a tabStore/Navigation).
 * - getTheme: CABLEADO → lee useThemeStore.getState().resolvedTheme.
 * - storage: CABLEADO → crea TauriStorageAdapter scoped por pluginId.
 * - registerKeybinding: STUB seguro → TODO Fase 3 (cablear a keybindingsService).
 * - hasCapability: CABLEADO → verifica contra HOST_CAPABILITIES.
 *
 * PROHIBIDO en esta fase:
 * - Modificar Navigation.tsx, Protected.Route.ts, appSidebar.tsx.
 * El cableado de la UI (que Navigation/Sidebar lean el RouteRegistry) es Fase 3.
 */

import type {
  Plugin,
  PluginAPI,
  PluginManifest,
  RouteConfig,
  SidebarSection,
  SettingsAction,
  CommandHandler,
  PluginEventHandler,
  Capability,
  AuthState,
  ActiveTabInfo,
  KeybindingDeclaration,
  NotifyOptions,
  ConfirmOptions,
  PromptOptions,
  PromptResult,
  PluginStorageAPI,
} from "@tps/plugin-sdk";
import { RouteRegistry } from "./core/route-registry";
import { logger } from "@/utils/logger";
import authSDK from "@/services/sdk-simple-auth";
import { useThemeStore } from "@/stores/themeStore";
import { useTabStore } from "@/states/tabStore";
import { createPlatformStorage } from "@/stores/platformStateStorage";
import { toast } from "sonner";
import { usePluginDialogStore } from "./stores/pluginDialogStore";

// ---------------------------------------------------------------------------
// Capabilities declaradas por el host TPS en esta fase.
// Fase 3 ampliará esto cuando se cablee sidebar/tabs/keybindings.
// ---------------------------------------------------------------------------

/**
 * Conjunto de capabilities que TPS soporta actualmente.
 * El kernel las valida contra el manifest.requires del plugin.
 *
 * Fase 2: views, navigation, settings, notifications, commands, events, storage.
 * Fase 3 agregará: tabs, keybindings (cuando esté cableado).
 */
const HOST_CAPABILITIES = new Set<Capability>([
  "views",
  "navigation",
  "settings",
  "notifications",
  "commands",
  "events",
  "storage",
  "tabs",          // Fase 3: cableado a tabStore (getActiveTab/onTabChange implementados)
  "keybindings",   // Fase 3 Batch 5: registry aislado de plugins + PluginKeybindingHost listener
]);

// ---------------------------------------------------------------------------
// Tipos internos del manager
// ---------------------------------------------------------------------------

/**
 * Entrada interna que el manager mantiene por cada plugin registrado.
 * Tracks todo lo que el plugin registra para cleanup automático en deactivate().
 */
interface PluginEntry {
  plugin: Plugin;
  isActive: boolean;
  /** IDs de SidebarSection registradas (para cleanup). */
  registeredSectionIds: string[];
  /** IDs de comando registrados (para cleanup). */
  registeredCommandIds: string[];
  /** IDs de ruta registrados en RouteRegistry (para cleanup). */
  registeredRouteIds: string[];
  /** IDs de SettingsAction registradas (para cleanup). */
  registeredSettingsActionIds: string[];
  /** Funciones de desuscripción del bus de eventos (para cleanup). */
  eventUnsubscribers: Array<() => void>;
  /**
   * Funciones de desuscripción de suscripciones al tabStore (onTabChange).
   * Se limpian automáticamente en deactivate(). Separadas de eventUnsubscribers
   * para distinguir el origen semántico (tabStore vs bus pub/sub de plugins).
   */
  tabUnsubscribers: Array<() => void>;
  /**
   * Funciones de desregistro de keybindings del plugin.
   * Cada entrada es el "unsubscribe" retornado al plugin en registerKeybinding().
   * Se limpian automáticamente en deactivate() para que el listener global las descarte.
   */
  keybindingUnsubscribers: Array<() => void>;
}

/**
 * Tipos de eventos que el manager emite internamente a los componentes del host.
 * No es el bus pub/sub de plugins — es el canal interno del manager.
 */
const MANAGER_EVENT_TYPE = {
  PLUGIN_ACTIVATED: "plugin-activated",
  PLUGIN_DEACTIVATED: "plugin-deactivated",
  PLUGINS_CHANGED: "plugins-changed",
} as const;

type ManagerEventType = (typeof MANAGER_EVENT_TYPE)[keyof typeof MANAGER_EVENT_TYPE];

/** Evento emitido por el manager a suscriptores del host (ej: hooks React de UI). */
interface ManagerEvent {
  type: ManagerEventType;
  pluginId: string;
  manifest: PluginManifest;
}

/** Listener registrado en el bus pub/sub entre plugins. */
interface PluginEventListener {
  pluginId: string;
  handler: PluginEventHandler;
}

// ---------------------------------------------------------------------------
// PluginStorageAPI implementación
// ---------------------------------------------------------------------------

/**
 * Implementación del PluginStorageAPI sobre el puerto de almacenamiento.
 *
 * El store se llama "plugin-{pluginId}.json" → namespacing automático por
 * plugin. Quién persiste realmente lo decide el target: un archivo JSON en
 * disco en escritorio, `localStorage` en web.
 */
class PluginStorageImpl implements PluginStorageAPI {
  private readonly storage: ReturnType<typeof createPlatformStorage>;

  constructor(pluginId: string) {
    // Nombre de store único por plugin → namespacing automático
    this.storage = createPlatformStorage(`plugin-${pluginId}.json`);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const raw = await this.storage.getItem(key);
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.storage.setItem(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }

  async has(key: string): Promise<boolean> {
    const raw = await this.storage.getItem(key);
    return raw !== null;
  }

  async clear(): Promise<void> {
    // El StateStorage de zustand no expone clear(). El puerto de clave/valor
    // SÍ lo tiene (`KeyValueStore.clear()`), así que la vía limpia es usar
    // getKeyValueStore().open(...) directamente en vez de pasar por el puente
    // de zustand. Queda pendiente.
    // Por ahora, no-op seguro: los datos quedan hasta desinstalación manual.
    logger.warn(
      "[PluginManager] PluginStorageImpl.clear() no está implementado en Fase 2. " +
        "Los datos del plugin persisten hasta que se limpien manualmente."
    );
  }
}

// ---------------------------------------------------------------------------
// PluginManagerClass
// ---------------------------------------------------------------------------

/**
 * Kernel del sistema de plugins de TPS.
 *
 * Responsabilidades:
 * - Registro y activación de plugins con validación de manifiesto y capabilities.
 * - Creación de la PluginAPI concreta por plugin (scoped).
 * - Tracking de todo lo registrado por cada plugin para cleanup automático.
 * - Bus pub/sub de eventos entre plugins.
 * - Bus interno de eventos del manager para componentes React del host.
 */
export class PluginManagerClass {
  /** Mapa de id → PluginEntry */
  private plugins: Map<string, PluginEntry> = new Map();

  /** Handlers de comandos registrados (globales, por commandId). */
  private commandHandlers: Map<string, CommandHandler> = new Map();

  /** Secciones del sidebar aportadas por plugins, ordenadas por `order`. */
  private sidebarSections: SidebarSection[] = [];

  /**
   * Caché estable para getSidebarSections().
   * Se invalida (null) en cada mutación del array. Garantiza referencia estable
   * para useSyncExternalStore — misma referencia = React omite el re-render.
   * Patrón idéntico al flatCache del RouteRegistry (Batch 1).
   */
  private sidebarSectionsCache: SidebarSection[] | null = null;

  /** Acciones del panel de settings aportadas por plugins. */
  private settingsActions: SettingsAction[] = [];

  /**
   * Caché estable para getSettingsActions().
   * Se invalida en cada mutación para garantizar referencia estable con useSyncExternalStore.
   */
  private settingsActionsCache: SettingsAction[] | null = null;

  /** Listeners del bus interno del manager (para hooks React del host). */
  private managerListeners: Set<(event: ManagerEvent) => void> = new Set();

  /**
   * Bus reactivo liviano (firma `() => void`) para useSyncExternalStore.
   * Separado del bus tipado (managerListeners) para no romper la firma pública de subscribe().
   * Se dispara cuando cambian sidebarSections o settingsActions.
   * Decisión: opción (a) — bus aditivo, consistente con el patrón de RouteRegistry (Batch 1).
   */
  private uiListeners: Set<() => void> = new Set();

  /**
   * Bus pub/sub entre plugins (por topic).
   * Cada topic mapea a un array de { pluginId, handler }.
   */
  private pluginEventBus: Map<string, PluginEventListener[]> = new Map();

  /**
   * Registry aislado de keybindings de plugins (Fase 3 Batch 5).
   *
   * Diseño: 100% paralelo al sistema de keybindings nativo de TPS (react-hotkeys-hook + Zustand).
   * NO modifica ni toca el sistema nativo — corre en paralelo, solo para plugins.
   *
   * Estructura: keybindingId → { pluginId, decl, handler }
   * `handler` es el CommandHandler del plugin que se ejecuta al disparar el binding.
   * El `keybindingId` es el `KeybindingDeclaration.id` del SDK — único por plugin.
   *
   * El `PluginKeybindingHost` (componente React montado en main.tsx) suscribe a este registry
   * via `subscribeKeybindings()` y monta UN listener `keydown` global que matchea las
   * combinaciones registradas aquí.
   */
  private pluginKeybindings: Map<string, { pluginId: string; decl: KeybindingDeclaration; handler: CommandHandler }> = new Map();

  /**
   * Listeners del bus de keybindings (para `PluginKeybindingHost`).
   * Se dispara cuando el registry muta (registro o desregistro).
   * Firma `() => void` compatible con useSyncExternalStore.
   */
  private keybindingListeners: Set<() => void> = new Set();

  // ── Getters para la UI (Fase 3 los consume) ──────────────────────────────

  /**
   * Retorna las secciones del sidebar aportadas por plugins activos.
   * El resultado está cacheado — devuelve la MISMA referencia de array mientras
   * no haya mutación. Requerido por useSyncExternalStore para evitar loops de re-render.
   */
  getSidebarSections(): SidebarSection[] {
    if (this.sidebarSectionsCache !== null) return this.sidebarSectionsCache;
    this.sidebarSectionsCache = [...this.sidebarSections];
    return this.sidebarSectionsCache;
  }

  /**
   * Retorna las acciones de settings aportadas por plugins activos.
   * El resultado está cacheado con referencia estable (mismo patrón que getSidebarSections).
   */
  getSettingsActions(): SettingsAction[] {
    if (this.settingsActionsCache !== null) return this.settingsActionsCache;
    this.settingsActionsCache = [...this.settingsActions];
    return this.settingsActionsCache;
  }

  // ── Bus reactivo para UI (Fase 3) ─────────────────────────────────────────

  /**
   * Suscribe un listener que se invoca cuando cambian sidebarSections o settingsActions.
   * Firma `() => void` compatible directamente con useSyncExternalStore.
   *
   * Bus ADITIVO — no reemplaza ni modifica subscribe() existente (bus tipado con ManagerEvent).
   * Patrón idéntico al RouteRegistry.subscribe() de Batch 1.
   *
   * @param listener - Función sin argumentos invocada en cada mutación de UI.
   * @returns Función de desuscripción.
   */
  subscribeUI(listener: () => void): () => void {
    this.uiListeners.add(listener);
    return () => {
      this.uiListeners.delete(listener);
    };
  }

  /** Notifica a los listeners de UI. Llamado internamente cuando mutan sidebarSections o settingsActions. */
  private notifyUI(): void {
    for (const listener of this.uiListeners) {
      listener();
    }
  }

  // ── Keybinding registry API (Fase 3 Batch 5) ──────────────────────────────

  /**
   * Retorna un snapshot inmutable del registry de keybindings de plugins.
   * Usado por `PluginKeybindingHost` vía useSyncExternalStore para re-sincronizar
   * el listener global de keydown cuando el registry muta.
   */
  getPluginKeybindings(): ReadonlyMap<string, { pluginId: string; decl: KeybindingDeclaration; handler: CommandHandler }> {
    return this.pluginKeybindings;
  }

  /**
   * Suscribe un listener al registry de keybindings de plugins.
   * Se invoca cuando se registra o desregistra un keybinding de plugin.
   * Firma `() => void` compatible con useSyncExternalStore.
   *
   * @param listener - Función invocada en cada mutación del registry.
   * @returns Función de desuscripción.
   */
  subscribeKeybindings(listener: () => void): () => void {
    this.keybindingListeners.add(listener);
    return () => {
      this.keybindingListeners.delete(listener);
    };
  }

  /** Notifica a los listeners del registry de keybindings. */
  private notifyKeybindings(): void {
    for (const listener of this.keybindingListeners) {
      listener();
    }
  }

  // ── Registro y ciclo de vida ───────────────────────────────────────────────

  /**
   * Registra un plugin en el manager sin activarlo.
   *
   * Validaciones:
   * 1. No registrar el mismo plugin dos veces (idempotente, warning).
   * 2. Verificar que todas las dependencias declaradas ya estén registradas.
   * 3. Validar `sdkVersion` contra la versión del SDK instalado.
   *
   * @param plugin - Implementación del contrato Plugin del SDK.
   */
  register(plugin: Plugin): void {
    const { id } = plugin.manifest;

    if (this.plugins.has(id)) {
      logger.warn(`[PluginManager] Plugin "${id}" ya está registrado. Ignorando.`);
      return;
    }

    // Validar dependencias declaradas
    if (plugin.manifest.dependencies && plugin.manifest.dependencies.length > 0) {
      for (const depId of plugin.manifest.dependencies) {
        if (!this.plugins.has(depId)) {
          logger.warn(
            `[PluginManager] Plugin "${id}" requiere la dependencia "${depId}" ` +
              `que no está registrada. Registrá "${depId}" primero.`
          );
          return;
        }
      }
    }

    // Validar sdkVersion (mínima: verifica que el plugin declare compatibilidad)
    // TODO Fase 3: implementar comparación semver real cuando se agregue una lib de semver.
    // Por ahora: si sdkVersion está vacío o no es string, se rechaza. Si es un string
    // que empieza con "^0." o "0." se acepta (compatible con 0.x.x del SDK).
    if (!this.isSdkVersionCompatible(plugin.manifest.sdkVersion)) {
      logger.warn(
        `[PluginManager] Plugin "${id}" declara sdkVersion "${plugin.manifest.sdkVersion}" ` +
          `que no es compatible con la versión del SDK instalado (0.1.0). Plugin rechazado.`
      );
      return;
    }

    this.plugins.set(id, {
      plugin,
      isActive: false,
      registeredSectionIds: [],
      registeredCommandIds: [],
      registeredRouteIds: [],
      registeredSettingsActionIds: [],
      eventUnsubscribers: [],
      tabUnsubscribers: [],
      keybindingUnsubscribers: [],
    });

    logger.info(`[PluginManager] Plugin "${id}" (${plugin.manifest.name}) registrado.`);
  }

  /**
   * Activa un plugin previamente registrado.
   *
   * Proceso:
   * 1. Verificar que todas las capabilities `requires` están disponibles en el host.
   * 2. Crear una PluginAPI scoped a este plugin.
   * 3. Llamar a plugin.activate(api).
   * 4. Emitir evento de activación al bus del manager.
   *
   * @param pluginId - ID del plugin a activar.
   */
  async activate(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId);

    if (!entry) {
      logger.warn(`[PluginManager] Plugin "${pluginId}" no está registrado.`);
      return;
    }

    if (entry.isActive) {
      logger.info(`[PluginManager] Plugin "${pluginId}" ya está activo. No-op.`);
      return;
    }

    // Verificar capabilities requeridas
    const missingCapabilities = this.getMissingCapabilities(entry.plugin.manifest);
    if (missingCapabilities.length > 0) {
      logger.warn(
        `[PluginManager] Plugin "${pluginId}" requiere capabilities que el host no soporta: ` +
          `[${missingCapabilities.join(", ")}]. Plugin NO activado.`
      );
      return;
    }

    // Crear PluginAPI scoped a este plugin
    const api = this.createPluginAPI(pluginId, entry);

    try {
      await entry.plugin.activate(api);
      entry.isActive = true;

      this.emitManagerEvent({
        type: MANAGER_EVENT_TYPE.PLUGIN_ACTIVATED,
        pluginId,
        manifest: entry.plugin.manifest,
      });
      this.emitManagerEvent({
        type: MANAGER_EVENT_TYPE.PLUGINS_CHANGED,
        pluginId,
        manifest: entry.plugin.manifest,
      });

      logger.info(
        `[PluginManager] Plugin "${pluginId}" (${entry.plugin.manifest.name}) activado correctamente.`
      );
    } catch (error) {
      logger.error(`[PluginManager] Error al activar plugin "${pluginId}":`, error);
    }
  }

  /**
   * Desactiva un plugin activo.
   *
   * Proceso:
   * 1. Llamar a plugin.deactivate() (si existe).
   * 2. Cleanup automático de todo lo registrado: routes, sections, settings, commands, events.
   * 3. Emitir evento de desactivación.
   *
   * @param pluginId - ID del plugin a desactivar.
   */
  async deactivate(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId);

    if (!entry || !entry.isActive) {
      return;
    }

    try {
      // Llamar al deactivate del plugin (cleanup a cargo del plugin)
      await entry.plugin.deactivate?.();
    } catch (error) {
      logger.error(
        `[PluginManager] Error en plugin.deactivate() de "${pluginId}":`,
        error
      );
      // Continúa con el cleanup del manager aunque el plugin falle
    }

    // Cleanup automático de comandos
    for (const commandId of entry.registeredCommandIds) {
      this.commandHandlers.delete(commandId);
    }
    entry.registeredCommandIds = [];

    // Cleanup automático de secciones del sidebar
    let sidebarMutated = false;
    for (const sectionId of entry.registeredSectionIds) {
      const idx = this.sidebarSections.findIndex((s) => s.id === sectionId);
      if (idx !== -1) {
        this.sidebarSections.splice(idx, 1);
        sidebarMutated = true;
      }
    }
    if (sidebarMutated) {
      this.sidebarSectionsCache = null;
    }
    entry.registeredSectionIds = [];

    // Cleanup automático de settings actions
    let settingsMutated = false;
    for (const actionId of entry.registeredSettingsActionIds) {
      const idx = this.settingsActions.findIndex((a) => a.id === actionId);
      if (idx !== -1) {
        this.settingsActions.splice(idx, 1);
        settingsMutated = true;
      }
    }
    if (settingsMutated) {
      this.settingsActionsCache = null;
    }
    entry.registeredSettingsActionIds = [];

    // Notificar al bus de UI si alguna colección mutó
    if (sidebarMutated || settingsMutated) {
      this.notifyUI();
    }

    // Cleanup automático de rutas en el RouteRegistry
    for (const routeId of entry.registeredRouteIds) {
      RouteRegistry.unregister(routeId);
    }
    entry.registeredRouteIds = [];

    // Cleanup automático de suscripciones al bus de eventos
    for (const unsub of entry.eventUnsubscribers) {
      unsub();
    }
    entry.eventUnsubscribers = [];

    // Cleanup automático de suscripciones al tabStore (onTabChange)
    for (const unsub of entry.tabUnsubscribers) {
      unsub();
    }
    entry.tabUnsubscribers = [];

    // Cleanup automático de keybindings del plugin (Fase 3 Batch 5)
    // Llama a cada unsub (que remueve la entrada del registry) y luego notifica al host.
    let keybindingsMutated = false;
    for (const unsub of entry.keybindingUnsubscribers) {
      unsub();
      keybindingsMutated = true;
    }
    entry.keybindingUnsubscribers = [];
    if (keybindingsMutated) {
      this.notifyKeybindings();
    }

    // Cleanup adicional de seguridad: eliminar cualquier keybinding de este plugin
    // que no haya sido desregistrado via unsub (ej: plugin no guardó el retorno).
    for (const [kbId, entry_] of this.pluginKeybindings) {
      if (entry_.pluginId === pluginId) {
        this.pluginKeybindings.delete(kbId);
        keybindingsMutated = true;
      }
    }
    // Notificar si el safety-sweep encontró algo extra
    if (keybindingsMutated) {
      this.notifyKeybindings();
    }

    // Cleanup adicional: eliminar todos los listeners del bus que sean de este plugin
    // (por si el plugin registró eventos sin retornar el unsubscriber correctamente)
    for (const [topic, listeners] of this.pluginEventBus) {
      const remaining = listeners.filter((l) => l.pluginId !== pluginId);
      if (remaining.length === 0) {
        this.pluginEventBus.delete(topic);
      } else {
        this.pluginEventBus.set(topic, remaining);
      }
    }

    entry.isActive = false;

    this.emitManagerEvent({
      type: MANAGER_EVENT_TYPE.PLUGIN_DEACTIVATED,
      pluginId,
      manifest: entry.plugin.manifest,
    });
    this.emitManagerEvent({
      type: MANAGER_EVENT_TYPE.PLUGINS_CHANGED,
      pluginId,
      manifest: entry.plugin.manifest,
    });

    logger.info(`[PluginManager] Plugin "${pluginId}" desactivado y limpiado correctamente.`);
  }

  /**
   * Activa todos los plugins registrados en orden de registro.
   * Útil para inicialización al startup de la app.
   */
  async activateAll(): Promise<void> {
    for (const [id] of this.plugins) {
      await this.activate(id);
    }
  }

  // ── Consultas de estado ────────────────────────────────────────────────────

  /** Retorna los manifiestos de todos los plugins registrados. */
  getManifests(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((e) => e.plugin.manifest);
  }

  /** Retorna true si el plugin está registrado y activo. */
  isActive(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.isActive ?? false;
  }

  /** Retorna true si el plugin está registrado (activo o inactivo). */
  isRegistered(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  // ── Comandos ────────────────────────────────────────────────────────────────

  /**
   * Ejecuta un comando registrado por cualquier plugin.
   *
   * @param commandId - ID del comando a ejecutar.
   */
  async executeCommand(commandId: string): Promise<void> {
    const handler = this.commandHandlers.get(commandId);
    if (!handler) {
      logger.warn(`[PluginManager] Comando "${commandId}" no está registrado.`);
      return;
    }
    try {
      await handler();
    } catch (error) {
      logger.error(`[PluginManager] Error ejecutando comando "${commandId}":`, error);
    }
  }

  // ── Bus interno del manager (para hooks React del host) ───────────────────

  /**
   * Suscribe a eventos del manager (activación, desactivación, cambios de estado).
   * Diseñado para hooks React del host, no para plugins.
   *
   * @param listener - Función llamada en cada evento del manager.
   * @returns Función de desuscripción.
   */
  subscribe(listener: (event: ManagerEvent) => void): () => void {
    this.managerListeners.add(listener);
    return () => {
      this.managerListeners.delete(listener);
    };
  }

  // ── Métodos privados ──────────────────────────────────────────────────────

  /**
   * Crea la PluginAPI concreta (scoped) para un plugin específico.
   * Cada plugin recibe su propia instancia de PluginAPI con closures que
   * trackean sus registros en la PluginEntry correspondiente.
   *
   * @param pluginId - ID del plugin.
   * @param entry - Entrada interna del plugin (para tracking).
   */
  private createPluginAPI(pluginId: string, entry: PluginEntry): PluginAPI {
    const manager = this;
    const storageImpl = new PluginStorageImpl(pluginId);

    const api: PluginAPI = {
      // ── Vistas y navegación ─────────────────────────────────────────────

      registerRoutes(routes: RouteConfig[]): void {
        RouteRegistry.register(routes);
        for (const route of routes) {
          if (!entry.registeredRouteIds.includes(route.id)) {
            entry.registeredRouteIds.push(route.id);
          }
        }
        logger.info(
          `[PluginManager] Plugin "${pluginId}" registró ${routes.length} ruta(s): ` +
            routes.map((r) => r.id).join(", ")
        );
      },

      registerSidebarSection(section: SidebarSection): void {
        if (!manager.sidebarSections.some((s) => s.id === section.id)) {
          manager.sidebarSections.push(section);
          manager.sidebarSections.sort((a, b) => a.order - b.order);
          // Invalidar caché para que getSidebarSections() devuelva nueva referencia
          manager.sidebarSectionsCache = null;
          entry.registeredSectionIds.push(section.id);
          // Notificar al bus de UI (useSyncExternalStore) que el snapshot cambió
          manager.notifyUI();
          logger.info(`[PluginManager] Plugin "${pluginId}" registró sidebar section "${section.id}".`);
        }
      },

      // ── Settings ──────────────────────────────────────────────────────────

      registerSettingsAction(action: SettingsAction): void {
        if (!manager.settingsActions.some((a) => a.id === action.id)) {
          manager.settingsActions.push(action);
          // Invalidar caché para que getSettingsActions() devuelva nueva referencia
          manager.settingsActionsCache = null;
          entry.registeredSettingsActionIds.push(action.id);
          // Notificar al bus de UI (useSyncExternalStore) que el snapshot cambió
          manager.notifyUI();
          logger.info(`[PluginManager] Plugin "${pluginId}" registró settings action "${action.id}".`);
        }
      },

      // ── Comandos ──────────────────────────────────────────────────────────

      registerCommand(commandId: string, handler: CommandHandler): void {
        if (manager.commandHandlers.has(commandId)) {
          logger.warn(
            `[PluginManager] Comando "${commandId}" ya está registrado. ` +
              `Plugin "${pluginId}" no puede sobreescribirlo.`
          );
          return;
        }
        manager.commandHandlers.set(commandId, handler);
        entry.registeredCommandIds.push(commandId);
        logger.info(`[PluginManager] Plugin "${pluginId}" registró comando "${commandId}".`);
      },

      async executeCommand(commandId: string): Promise<void> {
        await manager.executeCommand(commandId);
      },

      // ── Notificaciones ────────────────────────────────────────────────────
      // CABLEADO: usa `toast` de sonner directamente (importado como valor en este módulo).
      // No requiere contexto React — sonner expone un objeto imperativo.

      notify(message: string, opts?: NotifyOptions): void {
        const variant = opts?.variant ?? "info";
        const toastOpts = {
          description: opts?.description,
          duration: opts?.duration,
        };

        switch (variant) {
          case "success":
            toast.success(message, toastOpts);
            break;
          case "warning":
            toast.warning(message, toastOpts);
            break;
          case "error":
            toast.error(message, toastOpts);
            break;
          default:
            toast.info(message, toastOpts);
            break;
        }
      },

      async confirm(opts?: ConfirmOptions): Promise<boolean> {
        // CABLEADO Fase 3: delega al pluginDialogStore → PluginDialogHost (AlertDialog Radix).
        // Acceso sincrónico vía getState() — idéntico al patrón de useThemeStore.getState().
        return usePluginDialogStore.getState().requestConfirm(opts ?? {});
      },

      async prompt(opts: PromptOptions): Promise<PromptResult> {
        // CABLEADO Fase 3: delega al pluginDialogStore → PluginDialogHost (Dialog Radix).
        return usePluginDialogStore.getState().requestPrompt(opts);
      },

      // ── Auth ──────────────────────────────────────────────────────────────
      // CABLEADO: lee authSDK (importado como singleton en este módulo).

      getAuthState(): AuthState {
        const state = authSDK.getState();
        const sdkUser = state.user;
        return {
          isAuthenticated: state.isAuthenticated ?? (sdkUser !== null),
          user: sdkUser
            ? {
                id: String(sdkUser.id),
                name: sdkUser.name ?? sdkUser.username ?? sdkUser.email ?? "Usuario",
                roles: Array.isArray(sdkUser.roles)
                  ? (sdkUser.roles as string[])
                  : typeof sdkUser.role === "string"
                  ? [sdkUser.role]
                  : Array.isArray(sdkUser.role)
                  ? (sdkUser.role as string[])
                  : [],
              }
            : null,
        };
      },

      // ── Tabs ──────────────────────────────────────────────────────────────

      getActiveTab(): ActiveTabInfo | null {
        // Acceso sincrónico al tabStore — mismo patrón que useThemeStore.getState().
        const { tabs, activeTabId } = useTabStore.getState();
        if (!activeTabId) return null;
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab) return null;

        // routeId es requerido por ActiveTabInfo según el contrato del SDK.
        // Las tabs estáticas (nativas) no tienen routeId — no las exponemos vía esta API
        // porque el SDK no permite un ActiveTabInfo sin routeId.
        // Un plugin que llame getActiveTab() recibirá null si la tab activa es estática.
        if (!tab.routeId) return null;

        return {
          tabId: tab.id,
          routeId: tab.routeId,
          title: tab.title,
          path: tab.path,
          instanceId: tab.instanceId,
          metadata: tab.metadata as Record<string, unknown> | undefined,
        };
      },

      onTabChange(handler: (tab: ActiveTabInfo | null) => void): () => void {
        // tabStore NO usa subscribeWithSelector. Suscribimos al estado completo
        // y filtramos manualmente para evitar disparos espurios (Zustand 5 compatible).
        let prevActiveTabId = useTabStore.getState().activeTabId;

        const unsub = useTabStore.subscribe((state) => {
          const currentActiveTabId = state.activeTabId;
          // Solo disparar si el activeTabId cambió — evita re-disparos por otras mutaciones
          // del store (scrollPosition, reorder, etc.) que no cambian la tab activa.
          if (currentActiveTabId === prevActiveTabId) return;
          prevActiveTabId = currentActiveTabId;

          // Resolver la tab activa al shape ActiveTabInfo (o null)
          const tab = currentActiveTabId
            ? state.tabs.find((t) => t.id === currentActiveTabId)
            : undefined;

          if (!tab || !tab.routeId) {
            // Tab estática o sin tab activa — el SDK no puede representarla con ActiveTabInfo
            handler(null);
            return;
          }

          handler({
            tabId: tab.id,
            routeId: tab.routeId,
            title: tab.title,
            path: tab.path,
            instanceId: tab.instanceId,
            metadata: tab.metadata as Record<string, unknown> | undefined,
          });
        });

        // Registrar en tabUnsubscribers para cleanup automático en deactivate()
        entry.tabUnsubscribers.push(unsub);

        logger.info(`[PluginManager] Plugin "${pluginId}" suscrito a cambios de tab activa.`);

        return unsub;
      },

      // ── Keybindings ───────────────────────────────────────────────────────
      // Fase 3 Batch 5: registry aislado de plugins.
      // El sistema nativo de TPS (react-hotkeys-hook + Zustand) solo acepta comandos
      // estáticos declarados en COMMANDS (src/keybindings/core/commands.ts) y no expone
      // una API de registro programático fuera de React.
      // Solución: registry paralelo en el kernel + PluginKeybindingHost (listener global
      // de keydown montado en main.tsx). 100% aditivo — no toca el sistema nativo.

      registerKeybinding(decl: KeybindingDeclaration): void {
        // Prevenir duplicados: el ID del keybinding debe ser único en el registry global.
        if (manager.pluginKeybindings.has(decl.id)) {
          logger.warn(
            `[PluginManager] Keybinding "${decl.id}" ya está registrado. ` +
              `Plugin "${pluginId}" no puede sobreescribirlo.`
          );
          return;
        }

        // Resolver el CommandHandler del plugin: buscar en commandHandlers (el plugin
        // debería haber registrado el comando antes del keybinding, pero también
        // aceptamos un handler inline vía `decl.command` que referencie un command registrado).
        // El `decl.command` es el commandId a ejecutar cuando se dispara el binding.
        const handler: CommandHandler = () => manager.executeCommand(decl.command);

        manager.pluginKeybindings.set(decl.id, { pluginId, decl, handler });

        // Función de desregistro: remueve la entrada del registry y notifica al host.
        const unsub = () => {
          manager.pluginKeybindings.delete(decl.id);
          // No notificamos aquí porque deactivate() lo hace en bulk tras el loop.
          // Si el plugin llama unsub() manualmente (fuera de deactivate), sí notificamos.
          manager.notifyKeybindings();
        };

        // Trackear para cleanup automático en deactivate()
        entry.keybindingUnsubscribers.push(unsub);

        // Notificar al PluginKeybindingHost que el registry cambió
        manager.notifyKeybindings();

        logger.info(
          `[PluginManager] Plugin "${pluginId}" registró keybinding "${decl.id}" ` +
            `(key: "${decl.key}", command: "${decl.command}").`
        );
      },

      // ── Eventos (pub/sub) ─────────────────────────────────────────────────

      onEvent(topic: string, handler: PluginEventHandler): () => void {
        const listeners = manager.pluginEventBus.get(topic) ?? [];
        listeners.push({ pluginId, handler });
        manager.pluginEventBus.set(topic, listeners);

        const unsub = () => {
          const current = manager.pluginEventBus.get(topic);
          if (!current) return;
          const remaining = current.filter((l) => l.handler !== handler);
          if (remaining.length === 0) {
            manager.pluginEventBus.delete(topic);
          } else {
            manager.pluginEventBus.set(topic, remaining);
          }
        };

        // Registrar para cleanup automático en deactivate()
        entry.eventUnsubscribers.push(unsub);
        return unsub;
      },

      emitEvent(topic: string, payload?: unknown): void {
        const listeners = manager.pluginEventBus.get(topic);
        if (!listeners || listeners.length === 0) return;

        for (const listener of listeners) {
          try {
            void listener.handler(payload);
          } catch (error) {
            logger.error(
              `[PluginManager] Error en handler de evento "${topic}" ` +
                `del plugin "${listener.pluginId}":`,
              error
            );
          }
        }
      },

      // ── Tema ──────────────────────────────────────────────────────────────
      // CABLEADO: lee useThemeStore.getState() (acceso sincrónico al store de Zustand).

      getTheme(): "light" | "dark" {
        return useThemeStore.getState().resolvedTheme;
      },

      // ── Storage ───────────────────────────────────────────────────────────
      // CABLEADO: TauriStorageAdapter scoped al pluginId.

      storage: storageImpl,

      // ── Introspección ─────────────────────────────────────────────────────

      hasCapability(capability: Capability): boolean {
        return HOST_CAPABILITIES.has(capability);
      },
    };

    return api;
  }

  /**
   * Valida que las capabilities `requires` del plugin estén soportadas por el host.
   *
   * @param manifest - Manifiesto del plugin.
   * @returns Array de capabilities que faltan (vacío = todas están disponibles).
   */
  private getMissingCapabilities(manifest: PluginManifest): Capability[] {
    if (!manifest.requires || manifest.requires.length === 0) return [];
    return manifest.requires.filter((cap) => !HOST_CAPABILITIES.has(cap));
  }

  /**
   * Validación mínima de compatibilidad de sdkVersion.
   *
   * Lógica simplificada (sin librería semver):
   * - Acepta cualquier rango que comience con "^0." o "0." o ">=0." (compatible 0.x).
   * - Acepta "^0.1.0", "~0.1.0", "0.1.0", ">=0.1.0 <1.0.0".
   * - Rechaza versiones que claramente no son compatibles (>= 1.0.0 cuando el SDK es 0.x).
   *
   * TODO Fase 3: reemplazar con semver real si se agrega la librería `semver` al proyecto.
   *
   * @param sdkVersion - Rango semver declarado en el manifiesto del plugin.
   * @returns true si el rango es aceptable con el SDK instalado (0.1.0).
   */
  private isSdkVersionCompatible(sdkVersion: string): boolean {
    if (!sdkVersion || typeof sdkVersion !== "string") return false;

    // Versiones mayores claras → incompatible
    if (/^[>=^~]*[1-9]\d*\./.test(sdkVersion)) return false;

    // Acepta cualquier rango que empiece con 0.x
    return /^[>=^~<]*0\./.test(sdkVersion) || sdkVersion === "*";
  }

  /** Emite un evento al bus interno del manager (para componentes React del host). */
  private emitManagerEvent(event: ManagerEvent): void {
    for (const listener of this.managerListeners) {
      try {
        listener(event);
      } catch (error) {
        logger.error("[PluginManager] Error en listener del manager:", error);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/**
 * Singleton del PluginManager.
 * Compartido por todos los módulos del host que interactúan con plugins.
 *
 * Uso:
 * ```ts
 * import { PluginManager } from "@/plugins/plugin-manager";
 *
 * PluginManager.register(myPlugin);
 * await PluginManager.activate("com.rhleone.facturacion");
 * ```
 */
export const PluginManager = new PluginManagerClass();
