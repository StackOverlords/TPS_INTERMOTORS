/**
 * TauriPluginSource — implementación de PluginSource sobre Tauri.
 *
 * TODO el acoplamiento con `@tauri-apps/api/core` (invoke) vive AQUÍ.
 * El kernel de plugins consume solo la interfaz `PluginSource`.
 *
 * Los comandos Rust correspondientes se implementan en Batch B:
 *   - `get_external_plugins`  → list()
 *   - `install_plugin`        → install()
 *   - `uninstall_plugin`      → uninstall()
 *   - `set_plugin_enabled`    → setEnabled()
 *
 * ## Contrato Rust ↔ TypeScript — custom scheme `plugin://`
 * - Rust devuelve `entry` como PATH RELATIVO bajo `plugins_dir`, con forward slashes.
 *   Formato: `"<id>/<manifest.entry>"`, ej: `"com.rhleone.facturacion/remoteEntry.js"`.
 * - Este adapter construye la URL del custom scheme `plugin://` con ese path relativo:
 *   Linux/macOS: `plugin://localhost/com.rhleone.facturacion/remoteEntry.js`
 *   Windows:     `http://plugin.localhost/com.rhleone.facturacion/remoteEntry.js`
 * - El handler Rust (`register_uri_scheme_protocol("plugin", ...)` en `lib.rs`) mapea
 *   esa URI a `<app_data_dir>/plugins/<relPath>` y sirve el archivo con MIME correcto.
 * - El kernel de plugins (PluginManager) recibe ya la URL lista para
 *   pasarla a @module-federation/runtime registerRemotes.
 *
 * ## POR QUÉ custom scheme y NO el asset protocol
 * El asset protocol de Tauri tiene un problema estructural para bundles ESM multi-chunk:
 *
 * Opción A — usar `convertFileSrc()`: encodea TODA la ruta con `encodeURIComponent()`,
 *   convirtiendo los `/` en `%2F` → la URL queda como UN solo segmento
 *   (`asset://localhost/%2Fhome%2F...%2FremoteEntry.js`). Sirve un archivo suelto,
 *   PERO el `remoteEntry.js` de Module Federation hace `import("./assets/...")` RELATIVO:
 *   con la ruta colapsada la base resuelve a la raíz (`asset://localhost/assets/...`) →
 *   los chunks 404 → "Importing a module script failed".
 *
 * Opción B — encodear por segmento (preservar `/`): funciona para servir el remoteEntry.js,
 *   PERO Tauri quita el `/` inicial del path y el resultado queda relativo
 *   (`home/user/...` en vez de `/home/user/...`) → no matchea el scope configurado
 *   → "not configured to allow the path: home/...".
 *
 * No hay forma de URL que satisfaga AMBAS restricciones con el asset protocol.
 * Con un custom scheme `plugin://` NOSOTROS controlamos el parsing: el handler Rust
 * extrae el path después de `plugin://localhost/` y lo mapea directamente al
 * filesystem, preservando la estructura de directorios para los imports relativos.
 *
 * Los shapes de Rust usan snake_case; este adapter mapea los campos.
 */

import { invoke } from '@tauri-apps/api/core';
import type { ExternalPluginRef, PluginSource } from './PluginSource';

// ---------------------------------------------------------------------------
// Plugin URL builder (custom scheme `plugin://`)
// ---------------------------------------------------------------------------

/**
 * Construye una URL del custom scheme `plugin://` desde un path relativo bajo `plugins_dir`.
 *
 * El path relativo viene de Rust con forward slashes: `"<id>/<manifest.entry>"`.
 * Ej: `"com.rhleone.facturacion/remoteEntry.js"`.
 *
 * Cada segmento del path se encodea con `encodeURIComponent` para manejar
 * caracteres especiales (espacios, `#`, `?`, etc.), pero los `/` se preservan
 * como separadores reales de la URL para que la resolución relativa de los
 * chunks del bundle ESM funcione correctamente.
 *
 * Resultado:
 *   Linux/macOS: `plugin://localhost/com.rhleone.facturacion/remoteEntry.js`
 *   Windows:     `http://plugin.localhost/com.rhleone.facturacion/remoteEntry.js`
 */
function buildPluginUrl(relPath: string): string {
  const isWindows =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Windows');

  // Encodear cada segmento preservando los `/` como separadores reales.
  const encodedPath = relPath.split('/').map(encodeURIComponent).join('/');

  if (isWindows) {
    return `http://plugin.localhost/${encodedPath}`;
  }

  return `plugin://localhost/${encodedPath}`;
}

// ---------------------------------------------------------------------------
// Shape de Rust (snake_case) — lo que retorna/recibe el backend
// ---------------------------------------------------------------------------

/**
 * Forma en que Rust serializa un plugin externo.
 * `entry` es un PATH RELATIVO bajo `plugins_dir` (no una URL, no un path absoluto).
 * Formato: `"<id>/<manifest.entry>"`, ej: `"com.rhleone.facturacion/remoteEntry.js"`.
 * El mapper lo convierte a URL `plugin://localhost/<entry>`.
 */
interface RustExternalPlugin {
  id: string;
  name: string;
  version: string;
  /** Path relativo bajo plugins_dir. Rust NO genera la URL. El adapter sí. */
  entry: string;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/**
 * Convierte el shape de Rust al contrato TypeScript.
 *
 * CRÍTICO: `raw.entry` es un path relativo (`"<id>/remoteEntry.js"`).
 * Lo pasamos por `buildPluginUrl()` para generar la URL del custom scheme
 * `plugin://localhost/<id>/remoteEntry.js` que el WebView puede cargar junto
 * con sus chunks relativos (./assets/x.js → plugin://localhost/<id>/assets/x.js).
 * Esto es lo que @module-federation/runtime necesita en `registerRemotes`.
 */
function toExternalPluginRef(raw: RustExternalPlugin): ExternalPluginRef {
  return {
    id: raw.id,
    name: raw.name,
    version: raw.version,
    // Path relativo → URL custom scheme `plugin://` con segmentos preservados.
    // Ej: "com.rhleone.facturacion/remoteEntry.js"
    //   → "plugin://localhost/com.rhleone.facturacion/remoteEntry.js" (Linux/macOS)
    //   → "http://plugin.localhost/com.rhleone.facturacion/remoteEntry.js" (Windows)
    entry: buildPluginUrl(raw.entry),
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
