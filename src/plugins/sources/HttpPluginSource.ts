/**
 * HttpPluginSource — fuente de plugins para el target WEB.
 *
 * Gemelo de `TauriPluginSource`. Mismo contrato, distinto respaldo:
 *
 * | Operación   | Escritorio (Tauri)              | Web (este adapter)          |
 * |-------------|---------------------------------|-----------------------------|
 * | `list`      | `invoke('get_external_plugins')` | `GET    /plugins`           |
 * | `install`   | `invoke('install_plugin')`       | `POST   /plugins`           |
 * | `uninstall` | `invoke('uninstall_plugin')`     | `DELETE /plugins/{id}`      |
 * | `setEnabled`| `invoke('set_plugin_enabled')`   | `PATCH  /plugins/{id}`      |
 *
 * ## Por qué en web es MÁS simple
 *
 * El adapter de escritorio construye URLs con el custom scheme `plugin://`
 * porque Tauri no sirve archivos arbitrarios del disco al WebView. Toda esa
 * maquinaria (handler en Rust, encodeo por segmento, variante para Windows)
 * existe solo para esquivar esa restricción.
 *
 * En el navegador el problema no existe: el backend expone los bundles por
 * HTTP y una URL normal alcanza. Module Federation carga igual.
 *
 * ## Contrato con el backend
 *
 * El backend devuelve la MISMA forma que Rust —`entry` es un path RELATIVO,
 * no una URL— para que el mapeo a URL viva de un solo lado en cada target.
 *
 * ```json
 * { "id": "com.rhleone.facturacion", "name": "facturacionPlugin",
 *   "version": "1.0.0", "entry": "com.rhleone.facturacion/remoteEntry.js",
 *   "enabled": true }
 * ```
 *
 * ## Nota de seguridad
 *
 * Module Federation carga el plugin en el MISMO contexto JS que la app: puede
 * leer el token, el localStorage y todo lo demás. Eso ya es así en escritorio
 * —el WebView tampoco aísla— así que web no lo empeora. Si en algún momento se
 * aceptan plugins de terceros, el aislamiento hay que resolverlo en los dos
 * targets, y la vía es la misma: Web Worker o iframe con `postMessage`.
 */

import apiClient from '@/services/axios';

import type { ExternalPluginRef, PluginSource } from './PluginSource';

/**
 * Prefijo bajo el que el backend sirve los bundles de los plugins.
 *
 * Es una ruta RELATIVA a propósito: sirviendo el SPA desde el `public/` del
 * backend, plugins y app comparten origen y no interviene CORS. Si algún día
 * los bundles se mudan a un CDN, este es el único punto a cambiar — y ahí sí
 * hará falta `Access-Control-Allow-Origin` en ese host.
 */
const PLUGIN_ASSETS_BASE = '/plugins';

/** Endpoint de administración de plugins, relativo al `baseURL` de la API. */
const PLUGINS_ENDPOINT = '/plugins';

/**
 * Forma en que el backend serializa un plugin externo.
 * Espeja `RustExternalPlugin` del adapter de escritorio a propósito: así los
 * dos targets hablan el mismo lenguaje y solo cambia el transporte.
 */
interface ApiExternalPlugin {
  id: string;
  name: string;
  version: string;
  /** Path relativo bajo el directorio de plugins. El backend NO genera la URL. */
  entry: string;
  enabled: boolean;
}

/**
 * Construye la URL pública del `remoteEntry.js` desde el path relativo.
 *
 * Se encodea POR SEGMENTO, igual que el adapter de escritorio: los `/` deben
 * sobrevivir para que los chunks relativos del plugin (`./assets/x.js`)
 * resuelvan contra el directorio correcto.
 */
function buildPluginUrl(relativePath: string): string {
  const encoded = relativePath
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  return `${PLUGIN_ASSETS_BASE}/${encoded}`;
}

function toExternalPluginRef(raw: ApiExternalPlugin): ExternalPluginRef {
  return {
    id: raw.id,
    name: raw.name,
    version: raw.version,
    entry: buildPluginUrl(raw.entry),
    enabled: raw.enabled,
  };
}

/**
 * Implementación de `PluginSource` contra el backend HTTP.
 *
 * Usa el cliente axios de la app, así hereda el token de sesión, el refresh
 * automático y el formateo de errores. Los errores se propagan sin
 * transformar: el kernel decide si reintentar, loguear o avisar al usuario.
 */
export class HttpPluginSource implements PluginSource {
  async list(): Promise<ExternalPluginRef[]> {
    const { data } = await apiClient.get<ApiExternalPlugin[]>(PLUGINS_ENDPOINT);
    return data.map(toExternalPluginRef);
  }

  async install(source: string): Promise<ExternalPluginRef> {
    const { data } = await apiClient.post<ApiExternalPlugin>(
      PLUGINS_ENDPOINT,
      { source },
    );
    return toExternalPluginRef(data);
  }

  async uninstall(id: string): Promise<void> {
    await apiClient.delete(`${PLUGINS_ENDPOINT}/${encodeURIComponent(id)}`);
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await apiClient.patch(`${PLUGINS_ENDPOINT}/${encodeURIComponent(id)}`, {
      enabled,
    });
  }
}
