/**
 * Puerto: destino de los logs de la aplicación.
 *
 * Es el sumidero al que van los ~570 `Logger.*` / `logger.*` repartidos por la
 * app. NO reemplaza a `console.*`, que sigue siendo el canal de desarrollo.
 *
 * Escritorio: archivo de log de la app (`plugin-log`), útil para soporte
 * ("mandame el app.log"). Web: `console`, que es lo único que hay.
 *
 * Solo escribe. La lectura se eliminó junto con el Panel de Debug: nadie
 * consumía los logs desde la app, y sostener un buffer en memoria en web era
 * pagar complejidad por una función que no se usaba.
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LoggerPort {
  write(level: LogLevel, message: string): void;
}
