/**
 * Versión para mostrar al usuario: sin la "v" ni la variante del tenant.
 * El manifiesto de actualizaciones publica "v1.13.0-t1"; el usuario ve "1.13.0".
 */
export function displayVersion(version: string): string {
  return version.trim().replace(/^v/, '').replace(/-t\d+$/, '');
}
