/**
 * TauriPluginSource — implementación de PluginSource sobre Tauri.
 *
 * TODO el acoplamiento con `@tauri-apps/api/core` (invoke, convertFileSrc) vive AQUÍ.
 * El kernel de plugins consume solo la interfaz `PluginSource`.
 *
 * Los comandos Rust correspondientes se implementan en Batch B:
 *   - `get_external_plugins`  → list()
 *   - `install_plugin`        → install()
 *   - `uninstall_plugin`      → uninstall()
 *   - `set_plugin_enabled`    → setEnabled()
 *
 * ## Contrato Rust ↔ TypeScript — asset protocol
 * - Rust devuelve `entry` como PATH ABSOLUTO al remoteEntry.js en disco.
 *   Ej: "/home/user/.local/share/com.intermotors.tps/plugins/com.rhleone.facturacion/remoteEntry.js"
 * - Este adapter convierte ese path con `convertFileSrc()` ANTES de exponerlo
 *   como `ExternalPluginRef.entry`, generando una URL asset protocol que el
 *   WebView puede resolver:
 *   Ej Linux/macOS: "asset://localhost/home/user/.local/share/.../remoteEntry.js"
 *   Ej Windows:     "https://asset.localhost/C:/Users/.../remoteEntry.js"
 * - El kernel de plugins (PluginManager) recibe ya la URL lista para
 *   pasarla a @module-federation/runtime registerRemotes.
 *
 * Los shapes de Rust usan snake_case; este adapter mapea los campos.
 */

import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import type { ExternalPluginRef, PluginSource } from './PluginSource';

// ---------------------------------------------------------------------------
// Shape de Rust (snake_case) — lo que retorna/recibe el backend
// ---------------------------------------------------------------------------

/**
 * Forma en que Rust serializa un plugin externo.
 * `entry` es un PATH ABSOLUTO en disco (no una URL).
 * El mapper lo convierte a URL asset:// con convertFileSrc().
 */
interface RustExternalPlugin {
  id: string;
  name: string;
  version: string;
  /** Path absoluto al remoteEntry.js en disco. Rust NO genera la URL. */
  entry: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/**
 * Convierte el shape de Rust al contrato TypeScript.
 *
 * CRÍTICO: `raw.entry` es un path absoluto. Lo pasamos por `convertFileSrc()`
 * para generar la URL `asset://localhost/<path>` que el WebView puede cargar.
 * Esto es lo que @module-federation/runtime necesita en `registerRemotes`.
 */
function toExternalPluginRef(raw: RustExternalPlugin): ExternalPluginRef {
  return {
    id: raw.id,
    name: raw.name,
    version: raw.version,
    // Convierte path absoluto → URL asset protocol para el WebView.
    // Ej: "/home/user/.../remoteEntry.js" → "asset://localhost/home/user/.../remoteEntry.js"
    entry: convertFileSrc(raw.entry),
    enabled: raw.enabled,
  };
}

// ---------------------------------------------------------------------------
// TauriPluginSource
// ---------------------------------------------------------------------------

/**
 * Implementación de `PluginSource` que delega a comandos Tauri via invoke().
 *
 * Patrón de uso:
 * ```ts
 * const source: PluginSource = new TauriPluginSource();
 * const plugins = await source.list();
 * ```
 *
 * Los errores de Tauri (string o Error desde Rust) se propagan sin transformar.
 * El caller (kernel) decide si retryar, loguear o notificar al usuario.
 */
export class TauriPluginSource implements PluginSource {
  async list(): Promise<ExternalPluginRef[]> {
    const raw = await invoke<RustExternalPlugin[]>('get_external_plugins');
    return raw.map(toExternalPluginRef);
  }

  async install(source: string): Promise<ExternalPluginRef> {
    const raw = await invoke<RustExternalPlugin>('install_plugin', { source });
    return toExternalPluginRef(raw);
  }

  async uninstall(id: string): Promise<void> {
    await invoke<void>('uninstall_plugin', { id });
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await invoke<void>('set_plugin_enabled', { id, enabled });
  }
}
