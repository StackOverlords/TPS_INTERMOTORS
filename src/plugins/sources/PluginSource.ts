/**
 * PluginSource — contrato de abstracción para fuentes de plugins externos.
 *
 * Desacopla el kernel de plugins de Tauri: el kernel habla con `PluginSource`,
 * mientras que `TauriPluginSource` encapsula toda la lógica de invoke().
 *
 * Diseñado para Fase 4 del sistema de plugins de TPS_INTERMOTORS.
 */

// ---------------------------------------------------------------------------
// ExternalPluginRef — referencia a un plugin externo instalado
// ---------------------------------------------------------------------------

/**
 * Referencia a un plugin externo conocido por el host.
 * Contiene lo necesario para registrar el remote en @module-federation/runtime
 * y gestionar el ciclo de vida (habilitar/deshabilitar, desinstalar).
 */
export interface ExternalPluginRef {
  /** Identificador único en reverse-DNS. Ej: "com.rhleone.facturacion" */
  id: string;
  /**
   * Nombre del remote para @module-federation/runtime (registerRemotes).
   * Debe ser un identificador JS válido. Ej: "facturacionPlugin"
   */
  name: string;
  /** Versión semver del plugin instalado. Ej: "1.0.0" */
  version: string;
  /**
   * URL pública del remoteEntry.js que el WebView puede resolver.
   * Ej: "http://localhost:5174/remoteEntry.js" (dev)
   * o  "https://cdn.rhleone.com/plugins/facturacion/remoteEntry.js" (prod)
   */
  entry: string;
  /** Si el plugin está habilitado y debe activarse al iniciar. */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// PluginBundle — lo que hay que instalar, en la forma que cada target puede dar
// ---------------------------------------------------------------------------

/**
 * Bundle de plugin listo para instalar.
 *
 * Existe porque los dos targets NO pueden nombrar un bundle de la misma manera,
 * y fingir que sí rompía la instalación en web:
 *
 * - Escritorio elige una CARPETA del disco y Rust la lee. Lo único que viaja
 *   por el IPC es su path.
 * - El navegador no tiene paths. `<input type="file">` entrega un `File`; su
 *   `.name` es solo el nombre, nunca una ruta que el servidor pueda abrir. Por
 *   eso el backend recibe el zip por multipart, no un string.
 *
 * El discriminante `kind` deja que cada adapter rechace explícitamente lo que
 * no sabe manejar, en vez de mandarlo al backend y comerse un 422.
 */
export type PluginBundle =
  | {
      kind: 'path';
      /** Ruta absoluta de la carpeta del plugin en el disco del usuario. */
      path: string;
      /** Texto para mostrar mientras instala. */
      label: string;
    }
  | {
      kind: 'file';
      /** Zip elegido por el usuario. Debe traer `manifest.json` en la raíz. */
      file: File;
      /** Texto para mostrar mientras instala. */
      label: string;
    };

// ---------------------------------------------------------------------------
// PluginSource — interfaz de la fuente de plugins
// ---------------------------------------------------------------------------

/**
 * Abstracción para listar, instalar, desinstalar y habilitar/deshabilitar
 * plugins externos en el host TPS.
 *
 * La implementación concreta (`TauriPluginSource`) delega a comandos Rust
 * via invoke(). Esta interfaz permite inyectar mocks en tests o
 * fuentes alternativas sin tocar el kernel.
 */
export interface PluginSource {
  /**
   * Retorna todos los plugins externos conocidos por el host.
   * Incluye plugins instalados, habilitados y deshabilitados.
   */
  list(): Promise<ExternalPluginRef[]>;

  /**
   * Abre el selector nativo del target y devuelve lo que el usuario eligió.
   *
   * Vive en la fuente, y no en la UI, por la misma razón que los puertos de
   * `src/platform`: la pantalla de ajustes no tiene por qué saber si detrás hay
   * un diálogo de Tauri o un `<input type="file">`. Antes lo sabía —importaba
   * `@tauri-apps/plugin-dialog` directo— y eso dejaba la instalación web muerta.
   *
   * ⚠️ REGLA DE GESTO DEL USUARIO: la implementación web abre el selector en su
   * PRIMERA sentencia, antes de cualquier `await`. Un `await` previo termina la
   * tarea del gesto y el navegador descarta el `click()` SIN lanzar error. Misma
   * regla que `window.open()` en `platform/adapters/web/windowManager.ts`.
   *
   * @returns El bundle elegido, o `null` si el usuario canceló.
   */
  pickBundle(): Promise<PluginBundle | null>;

  /**
   * Instala un plugin desde el bundle indicado.
   *
   * @param bundle - Lo devuelto por `pickBundle()` de ESTA misma fuente.
   * @returns La referencia del plugin recién instalado (habilitado por defecto).
   * @throws Si el `kind` no corresponde al target, o si la instalación falla
   *         (manifiesto inválido, zip corrupto, red caída, etc.).
   */
  install(bundle: PluginBundle): Promise<ExternalPluginRef>;

  /**
   * Desinstala un plugin por su ID.
   * Si el plugin está activo, el caller es responsable de desactivarlo primero.
   *
   * @param id - ID del plugin en reverse-DNS.
   * @throws Si el plugin no existe o la desinstalación falla.
   */
  uninstall(id: string): Promise<void>;

  /**
   * Habilita o deshabilita un plugin sin desinstalarlo.
   * El estado persiste entre sesiones.
   *
   * @param id - ID del plugin en reverse-DNS.
   * @param enabled - `true` para habilitar, `false` para deshabilitar.
   * @throws Si el plugin no existe o el cambio de estado falla.
   */
  setEnabled(id: string, enabled: boolean): Promise<void>;
}
