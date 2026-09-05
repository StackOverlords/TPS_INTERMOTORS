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
import { environment } from '@/utils/environment';

import type {
  ExternalPluginRef,
  PluginBundle,
  PluginSource,
} from './PluginSource';

/**
 * Endpoint bajo el que el backend sirve los bundles.
 *
 * Va separado del CRUD (`/plugins`) para que no se mezclen: acá el `{path}`
 * final acepta barras, porque Module Federation pide el `remoteEntry.js` y
 * después sus chunks con rutas relativas de profundidad arbitraria.
 *
 * Se construye sobre `environment.apiUrl`, que sirviendo el SPA desde el
 * `public/` del backend es relativo (`/api/v1`): mismo origen, sin CORS. Si
 * algún día los bundles se mudan a un CDN, este es el único punto a cambiar
 * —y ahí sí hará falta `Access-Control-Allow-Origin` en ese host.
 */
const PLUGIN_ASSETS_PATH = 'plugin-assets';

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
 * El backend devuelve `entry` como `<id>/<archivo>`, igual que Rust. Los `/`
 * deben sobrevivir al encodeo para que los chunks relativos del plugin
 * (`./assets/x.js`) resuelvan contra el directorio correcto.
 */
function buildPluginUrl(relativePath: string): string {
  const encoded = relativePath
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  const base = environment.apiUrl.replace(/\/$/, '');

  return `${base}/${PLUGIN_ASSETS_PATH}/${encoded}`;
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

  /**
   * Selector de archivo del navegador.
   *
   * Un `<input type="file">` fuera del DOM alcanza: nunca se muestra, solo se
   * usa por su `click()`, que abre el selector nativo del sistema.
   *
   * ⚠️ El `click()` va en la primera sentencia, ANTES de cualquier `await`.
   * Igual que `window.open()`, el navegador solo lo permite mientras dura la
   * tarea del gesto del usuario, y si se pasó lo descarta EN SILENCIO: no
   * lanza, simplemente no abre nada.
   */
  pickBundle(): Promise<PluginBundle | null> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,application/zip';

    const picked = new Promise<PluginBundle | null>((resolve) => {
      // `cancel` avisa que el usuario cerró el selector sin elegir. Sin él la
      // promesa quedaría colgada para siempre y con ella el handler que espera.
      input.addEventListener('cancel', () => resolve(null), { once: true });

      input.addEventListener(
        'change',
        () => {
          const file = input.files?.[0];
          resolve(file ? { kind: 'file', file, label: file.name } : null);
        },
        { once: true },
      );
    });

    input.click();

    return picked;
  }

  async install(bundle: PluginBundle): Promise<ExternalPluginRef> {
    if (bundle.kind !== 'file') {
      throw new Error(
        'El instalador web espera un archivo .zip; el navegador no puede leer rutas del disco.',
      );
    }

    // Multipart, no JSON: el backend valida `file` como archivo subido. Mandar
    // un path en el body —como hacía antes— devolvía 422 siempre, porque del
    // lado del servidor esa ruta no existe.
    const body = new FormData();
    body.append('file', bundle.file);

    const { data } = await apiClient.post<ApiExternalPlugin>(
      PLUGINS_ENDPOINT,
      body,
      // ⚠️ Pisar el Content-Type acá NO es ceremonia: `apiClient` trae
      // `application/json` por defecto, y con ese header axios 1.x serializa el
      // FormData a JSON (`transformRequest` → `formDataToJSON`). El archivo se
      // pierde EN SILENCIO y el backend responde 422 "file required".
      //
      // No hace falta armar el boundary: al ver un FormData, el adapter XHR
      // borra este header y deja que el navegador ponga el suyo, con boundary.
      { headers: { 'Content-Type': 'multipart/form-data' } },
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
