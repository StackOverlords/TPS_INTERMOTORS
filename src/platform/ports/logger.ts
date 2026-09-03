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

export interface LogEntry {
  level: LogLevel;
  message: string;
  /** ISO 8601. */
  timestamp: string;
}

export interface LoggerPort {
  write(level: LogLevel, message: string): void;

  /** `true` si el target puede recuperar logs pasados. */
  canReadLogs(): boolean;

  /**
   * Devuelve los logs disponibles, del más viejo al más nuevo.
   * Array vacío si el target no puede leerlos.
   */
  readRecentLogs(): Promise<LogEntry[]>;

  /** Borra los logs acumulados donde sea posible. */
  clearLogs(): Promise<void>;
}
