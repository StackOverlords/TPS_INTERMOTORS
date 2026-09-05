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
   * Instala un plugin desde la fuente indicada.
   *
   * @param source - URL, path o identificador de marketplace del plugin a instalar.
   * @returns La referencia del plugin recién instalado (habilitado por defecto).
   * @throws Si la instalación falla (URL inaccesible, manifiesto inválido, etc.).
   */
  install(source: string): Promise<ExternalPluginRef>;

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
