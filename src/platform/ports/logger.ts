/**
 * Puerto: destino persistente de logs de la aplicación.
 *
 * NO reemplaza a `console.*` —que sigue siendo el canal de desarrollo— sino al
 * sumidero que sobrevive a la sesión y alimenta el Panel de Debug.
 *
 * Escritorio: archivo de log de la app (`plugin-log` / comandos Rust).
 * Web: no existe un archivo; se guarda un buffer en memoria acotado, que se
 * pierde al recargar. Es la degradación honesta — el navegador no da acceso al
 * disco, y para diagnóstico real en web el destino correcto es el backend.
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LoggerPort {
  write(level: LogLevel, message: string): void;

  /** `true` si el target puede recuperar logs pasados. */
  canReadLogs(): boolean;

  /**
   * Todo el log disponible como texto plano, una entrada por línea.
   *
   * Se devuelve texto y no entradas estructuradas porque es el formato real en
   * los dos targets: en escritorio el archivo ya es texto, y el Panel de Debug
   * filtra por línea. Estructurarlo para volver a aplanarlo no agrega nada.
   */
  readLogText(): Promise<string>;

  /**
   * Ruta del archivo de log, para mostrarla en la UI.
   * `null` donde no hay archivo (web).
   */
  getLogLocation(): Promise<string | null>;

  /** Borra los logs acumulados. */
  clearLogs(): Promise<void>;
}
