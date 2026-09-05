/**
 * @tps/plugin-sdk — Contrato del sistema de plugins de TPS_INTERMOTORS.
 *
 * Este archivo define TODOS los tipos públicos del SDK.
 * El paquete no tiene dependencias de runtime — solo type-imports de React
 * para tipos de componentes (ComponentType).
 *
 * Regla de oro: un plugin NUNCA importa @tauri-apps/*, stores del host,
 * ni rutas @/. Solo codea contra este contrato y recibe el `api` en activate().
 */

import type { ComponentType } from "react";

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

/**
 * Capacidades que un plugin puede declarar en su manifiesto.
 * El kernel verifica que el host soporte todas las `requires` antes de activar.
 *
 * - "views"         : el plugin registra rutas/pantallas React (RouteConfig)
 * - "navigation"    : el plugin modifica la navegación principal
 * - "tabs"          : el plugin interactúa con el sistema de tabs
 * - "settings"      : el plugin agrega acciones al panel de configuración
 * - "notifications" : el plugin emite notificaciones al usuario
 * - "commands"      : el plugin registra/ejecuta comandos
 * - "events"        : el plugin publica/suscribe eventos entre plugins
 * - "storage"       : el plugin persiste datos via PluginStorageAPI
 * - "keybindings"   : el plugin registra atajos de teclado
 */
const CAPABILITY = {
  VIEWS: "views",
  NAVIGATION: "navigation",
  TABS: "tabs",
  SETTINGS: "settings",
  NOTIFICATIONS: "notifications",
  COMMANDS: "commands",
  EVENTS: "events",
  STORAGE: "storage",
  KEYBINDINGS: "keybindings",
} as const;

/** Unión de todas las capacidades disponibles en el host TPS. */
export type Capability = (typeof CAPABILITY)[keyof typeof CAPABILITY];

export { CAPABILITY };

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/**
 * Manifiesto declarativo del plugin.
 * Debe ser serializable (sin funciones) — el kernel lo lee antes de activar.
 */
export interface PluginManifest {
  /** Identificador único en reverse-DNS. Ej: "com.rhleone.facturacion" */
  id: string;
  /** Nombre legible para el usuario. */
  name: string;
  /** Versión semver del plugin. Ej: "1.0.0" */
  version: string;
  /** Descripción breve del plugin (opcional, UI de gestión). */
  description?: string;
  /** Autor del plugin (opcional). */
  author?: string;
  /**
   * Rango semver del SDK soportado por este plugin.
   * El kernel rechaza el plugin si la versión del SDK instalado no satisface este rango.
   * Ej: "^0.1.0"
   */
  sdkVersion: string;
  /** Capacidades que el plugin REQUIERE para funcionar. El kernel las valida al activar. */
  requires: Capability[];
  /** Capacidades opcionales — el plugin funciona sin ellas pero las aprovecha si están. */
  optional?: Capability[];
  /**
   * IDs de otros plugins de los que depende este plugin.
   * El kernel activa las dependencias primero (ya implementado en excalidraw PluginManager).
   */
  dependencies?: string[];
}

// ---------------------------------------------------------------------------
// Tipos de soporte para PluginAPI
// ---------------------------------------------------------------------------

/**
 * Manejador de comandos registrado por el plugin.
 * Puede ser síncrono o asíncrono.
 */
export type CommandHandler = () => void | Promise<void>;

/**
 * Manejador de eventos del bus pub/sub entre plugins y host.
 * El payload es `unknown` a propósito — el bus es genérico.
 */
export type PluginEventHandler = (payload: unknown) => void | Promise<void>;

/**
 * Objeto descartable retornado por suscripciones.
 * Llamar a dispose() cancela la suscripción y limpia recursos.
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Configuración de una ruta registrada por el plugin.
 * El host la agrega al RouteRegistry y la sidebar/navegación la consume.
 */
export interface RouteConfig {
  /** Identificador único de la ruta. Ej: "facturacion.lista-facturas" */
  id: string;
  /** Segmento de URL. Ej: "/facturacion/facturas" */
  path: string;
  /** Etiqueta para sidebar y tabs. */
  label: string;
  /** Componente React que renderiza la vista. */
  component: ComponentType;
  /**
   * Ícono para sidebar/tab. ComponentType en lugar de elemento JSX
   * para evitar el gotcha de serialización (ref: PLUGIN_SYSTEM_DESIGN §7.1).
   */
  icon?: ComponentType<IconProps>;
  /** Roles de usuario que pueden acceder. Vacío = acceso público. */
  roles?: string[];
  /** Configuración adicional para el sistema de tabs. */
  tabConfig?: TabRouteConfig;
}

/** Props mínimas que el host pasa a los íconos de plugins. */
export interface IconProps {
  className?: string;
  size?: number;
}

/** Configuración del tab generado al abrir esta ruta. */
export interface TabRouteConfig {
  /** Si el tab puede cerrarse por el usuario. Default: true. */
  closable?: boolean;
  /** Si el tab inicia fijado. Default: false. */
  pinned?: boolean;
  /** Título del tab (override del label de la ruta). */
  title?: string;
}

/**
 * Sección del sidebar registrada por el plugin.
 * Se inserta entre las secciones nativas del host según `order`.
 */
export interface SidebarSection {
  /** ID único de la sección. */
  id: string;
  /** Etiqueta visible en el sidebar. */
  label: string;
  /**
   * Orden de inserción (menor = más arriba).
   * Las secciones nativas del host usan múltiplos de 100.
   */
  order: number;
  /** Ícono de la sección (opcional). */
  icon?: ComponentType<IconProps>;
  /** Rutas que aparecen como ítems dentro de la sección. */
  items: RouteConfig[];
}

/**
 * Acción del panel de configuración registrada por el plugin.
 * Aparece en el menú de ajustes del sidebar footer.
 */
export interface SettingsAction {
  /** ID único de la acción. */
  id: string;
  /** Etiqueta visible. */
  label: string;
  /** Ícono (opcional). */
  icon?: ComponentType<IconProps>;
  /** Callback al ejecutar la acción. */
  onClick?: () => void;
  /** Si la acción es destructiva (se muestra en rojo). Default: false. */
  destructive?: boolean;
  /** Submenú de acciones hijas. */
  submenu?: SettingsActionItem[];
}

/** Ítem de submenú dentro de una SettingsAction. */
export interface SettingsActionItem {
  id: string;
  label: string;
  icon?: ComponentType<IconProps>;
  onClick: () => void;
  isActive?: boolean;
}

/**
 * Opciones para notificaciones (toast).
 * Basado en el sistema de notificaciones existente en TPS.
 */
export interface NotifyOptions {
  /** Variante visual. Default: "info" */
  variant?: "info" | "success" | "warning" | "error";
  /** Duración en ms. Default decidido por el host. */
  duration?: number;
  /** Descripción adicional bajo el mensaje principal. */
  description?: string;
}

/** Opciones para el diálogo de confirmación. */
export interface ConfirmOptions {
  /** Título del diálogo. */
  title?: string;
  /** Mensaje/descripción. */
  message?: string;
  /** Texto del botón de confirmación. Default: "Confirmar" */
  confirmLabel?: string;
  /** Texto del botón de cancelación. Default: "Cancelar" */
  cancelLabel?: string;
  /** Si la acción es destructiva (botón en rojo). Default: false. */
  destructive?: boolean;
}

/** Campo de formulario para el diálogo de prompt. */
export interface PromptField {
  /** ID único del campo (clave en el resultado). */
  id: string;
  /** Etiqueta del campo. */
  label: string;
  /** Tipo de input. Default: "text" */
  type?: "text" | "password" | "email" | "number" | "textarea";
  /** Placeholder del input. */
  placeholder?: string;
  /** Valor inicial. */
  defaultValue?: string;
  /** Si el campo es obligatorio. */
  required?: boolean;
}

/** Opciones para el diálogo de prompt (formulario inline). */
export interface PromptOptions {
  /** Título del diálogo. */
  title: string;
  /** Descripción/instrucción (opcional). */
  description?: string;
  /** Campos del formulario. */
  fields: PromptField[];
  /** Texto del botón de confirmación. Default: "Aceptar" */
  confirmLabel?: string;
  /** Texto del botón de cancelación. Default: "Cancelar" */
  cancelLabel?: string;
}

/**
 * Resultado del diálogo de prompt.
 * `null` si el usuario canceló; objeto de campo→valor si confirmó.
 */
export type PromptResult = Record<string, string> | null;

/**
 * Estado de autenticación del usuario en el host.
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

/**
 * Datos del usuario autenticado expuestos al plugin.
 * Subconjunto mínimo — no se expone información sensible.
 */
export interface AuthUser {
  /** ID del usuario en el sistema TPS. */
  id: string;
  /** Nombre o email legible. */
  name: string;
  /** Roles del usuario (para control de acceso). */
  roles: string[];
}

/**
 * Información de la tab activa en el momento de consultar.
 */
export interface ActiveTabInfo {
  /** ID único de la instancia de tab. */
  tabId: string;
  /** ID de la ruta asociada (del RouteRegistry). */
  routeId: string;
  /** Título visible en la tab. */
  title: string;
  /** Path de URL de la ruta. */
  path: string;
  /** ID de instancia para tabs con múltiples instancias de la misma ruta. */
  instanceId?: string;
  /** Metadatos arbitrarios específicos de la ruta. */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Declaración de keybinding
// ---------------------------------------------------------------------------

/**
 * Declaración de atajo de teclado registrado por el plugin.
 * Compatible con el sistema de keybindings de TPS.
 */
export interface KeybindingDeclaration {
  /** ID único del keybinding. Ej: "facturacion.nueva-factura" */
  id: string;
  /** Combinación de teclas. Ej: "ctrl+shift+f", "mod+k facturacion" */
  key: string;
  /** ID del comando a ejecutar. */
  command: string;
  /** Expresión condicional (cuándo aplica el binding). Opcional. */
  when?: string;
  /** Descripción legible (para UI de keybindings). */
  description?: string;
}

// ---------------------------------------------------------------------------
// Storage API
// ---------------------------------------------------------------------------

/**
 * API de storage con scope al plugin.
 * Implementado sobre createTauriStorage del host, con prefijo = pluginId.
 * Solo serializa valores JSON-safe.
 */
export interface PluginStorageAPI {
  /** Obtiene un valor por clave. Retorna `undefined` si no existe. */
  get<T>(key: string): Promise<T | undefined>;
  /** Guarda un valor. El valor debe ser serializable a JSON. */
  set<T>(key: string, value: T): Promise<void>;
  /** Elimina una clave. No-op si no existe. */
  delete(key: string): Promise<void>;
  /** Verifica si una clave existe. */
  has(key: string): Promise<boolean>;
  /** Elimina TODOS los datos del plugin (para desinstalación limpia). */
  clear(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Plugin API (superficie host → plugin)
// ---------------------------------------------------------------------------

/**
 * API pública que el host expone al plugin durante activate().
 *
 * Contrato alineado a §4 de PLUGIN_SYSTEM_DESIGN.md.
 * Podado respecto a excalidraw: sin diagram, document, files de canvas,
 * registerFileIcon, registerFileHandler, registerContext, openFile, getWorkspaceDir.
 *
 * Las funciones que retornan `() => void` son "unsubscribe/dispose" —
 * el plugin DEBE guardarlas y llamarlas en deactivate() para evitar memory leaks.
 */
export interface PluginAPI {
  // ── Vistas y navegación ─────────────────────────────────────────────────

  /**
   * Registra rutas React en el RouteRegistry del host.
   * Las rutas aparecen automáticamente en la navegación y sidebar del host.
   * Requiere capability "views".
   */
  registerRoutes(routes: RouteConfig[]): void;

  /**
   * Registra una sección en el sidebar del host.
   * Requiere capability "navigation".
   */
  registerSidebarSection(section: SidebarSection): void;

  // ── Settings ─────────────────────────────────────────────────────────────

  /**
   * Registra una acción en el panel de configuración del sidebar.
   * Requiere capability "settings".
   */
  registerSettingsAction(action: SettingsAction): void;

  // ── Comandos ─────────────────────────────────────────────────────────────

  /**
   * Registra un comando identificado por `commandId`.
   * El comando puede ejecutarse via executeCommand() o un keybinding.
   * Requiere capability "commands".
   */
  registerCommand(commandId: string, handler: CommandHandler): void;

  /**
   * Ejecuta un comando registrado (propio o de otro plugin).
   * Retorna una promesa que resuelve cuando el comando termina.
   * Requiere capability "commands".
   */
  executeCommand(commandId: string): Promise<void>;

  // ── Notificaciones ───────────────────────────────────────────────────────

  /**
   * Muestra un toast al usuario.
   * Requiere capability "notifications".
   */
  notify(message: string, opts?: NotifyOptions): void;

  /**
   * Abre un diálogo de confirmación modal.
   * Retorna `true` si el usuario confirmó, `false` si canceló.
   * Requiere capability "notifications".
   */
  confirm(opts?: ConfirmOptions): Promise<boolean>;

  /**
   * Abre un diálogo de formulario inline.
   * Retorna un objeto campo→valor si confirmó, `null` si canceló.
   * Requiere capability "notifications".
   */
  prompt(opts: PromptOptions): Promise<PromptResult>;

  // ── Auth ─────────────────────────────────────────────────────────────────

  /**
   * Retorna el estado de autenticación actual del host.
   * Los datos del usuario son un subconjunto seguro (no expone tokens).
   */
  getAuthState(): AuthState;

  // ── Tabs ─────────────────────────────────────────────────────────────────

  /**
   * Retorna información de la tab activa, o `null` si no hay ninguna.
   * Requiere capability "tabs".
   */
  getActiveTab(): ActiveTabInfo | null;

  /**
   * Suscribe a cambios de la tab activa.
   * El handler se llama inmediatamente con el estado actual, luego en cada cambio.
   * Retorna una función de desuscripción — llamarla en deactivate().
   * Requiere capability "tabs".
   */
  onTabChange(handler: (tab: ActiveTabInfo | null) => void): () => void;

  // ── Keybindings ──────────────────────────────────────────────────────────

  /**
   * Registra un atajo de teclado para este plugin.
   * El binding se etiqueta con source 'plugin' y se desregistra automáticamente
   * al desactivar el plugin.
   * Requiere capability "keybindings".
   */
  registerKeybinding(decl: KeybindingDeclaration): void;

  // ── Eventos (pub/sub) ────────────────────────────────────────────────────

  /**
   * Suscribe a un topic del bus de eventos.
   * Los topics deben estar namespaced. Ej: "facturacion.facturaCreada"
   * Retorna una función de desuscripción — llamarla en deactivate().
   * Requiere capability "events".
   */
  onEvent(topic: string, handler: PluginEventHandler): () => void;

  /**
   * Emite un evento en un topic.
   * Solo los suscriptores que conocen el contrato del payload deben reaccionar.
   * Requiere capability "events".
   */
  emitEvent(topic: string, payload?: unknown): void;

  // ── Tema y UI ────────────────────────────────────────────────────────────

  /**
   * Retorna el tema visual activo en el host ("light" | "dark").
   */
  getTheme(): "light" | "dark";

  // ── Storage ──────────────────────────────────────────────────────────────

  /**
   * API de storage con scope al plugin.
   * Persiste datos entre sesiones usando el mecanismo del host (createTauriStorage).
   * Requiere capability "storage".
   */
  storage: PluginStorageAPI;

  // ── Introspección ────────────────────────────────────────────────────────

  /**
   * Verifica si el host soporta una capability determinada.
   * Util para código condicional basado en capabilities opcionales.
   */
  hasCapability(capability: Capability): boolean;
}

// ---------------------------------------------------------------------------
// Plugin (la unidad que exporta cada plugin externo)
// ---------------------------------------------------------------------------

/**
 * Contrato que debe implementar cada plugin.
 * El plugin externo exporta esto como default desde su entry point.
 *
 * @example
 * ```ts
 * import { definePlugin } from "@tps/plugin-sdk";
 *
 * export default definePlugin({
 *   manifest: {
 *     id: "com.rhleone.facturacion",
 *     name: "Facturación",
 *     version: "1.0.0",
 *     sdkVersion: "^0.1.0",
 *     requires: ["views", "navigation", "storage"],
 *   },
 *   activate(api) {
 *     api.registerRoutes([{ id: "facturacion.lista", path: "/facturas", label: "Facturas", component: ListaFacturas }]);
 *   },
 *   deactivate() {
 *     // cleanup — el kernel llama esto al desactivar
 *   },
 * });
 * ```
 */
export interface Plugin {
  manifest: PluginManifest;
  /**
   * Ciclo de vida: activación.
   * El kernel llama a activate() después de verificar el manifiesto y las capabilities.
   * Puede ser asíncrono (lazy-load de recursos, conexión a servicios, etc.).
   */
  activate(api: PluginAPI): void | Promise<void>;
  /**
   * Ciclo de vida: desactivación.
   * El kernel llama a deactivate() cuando el usuario desactiva/desinstala el plugin.
   * Debe cancelar todas las suscripciones (retornadas por onEvent, onTabChange, etc.).
   */
  deactivate?(): void | Promise<void>;
}
