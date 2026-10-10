/**
 * Texto legible de un error del actualizador.
 *
 * Los comandos de Tauri rechazan con un string, no con un `Error`: con un
 * `instanceof Error` a secas se perdía el motivo real y la UI solo decía
 * "Error al descargar/instalar actualización".
 */
export function describeUpdateError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error && typeof error === 'object') {
    try {
      const json = JSON.stringify(error);
      if (json && json !== '{}') return json;
    } catch {
      // Objetos circulares: caen al texto genérico.
    }
  }
  return 'Error desconocido';
}
