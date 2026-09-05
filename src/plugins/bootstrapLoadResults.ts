/**
 * bootstrapLoadResults — store módulo-scope de los resultados de carga de
 * plugins externos del bootstrap.
 *
 * Vive en su propio módulo (liviano, sin imports del design system) para que
 * `main.tsx` pueda llamar `setBootstrapLoadResults()` desde la cadena de import
 * dinámico SIN arrastrar la pantalla `PluginSettings` al bundle inicial.
 *
 * Decisión de diseño: módulo-scope en lugar de Zustand — estado efímero de
 * sesión, no necesita persistir ni reactividad cross-component.
 */

import type { LoadResult } from "./loadExternalPlugins";

let _bootstrapLoadResults: LoadResult[] = [];

/** Llamado desde el bootstrap (main.tsx) tras `loadExternalPlugins()`. */
export function setBootstrapLoadResults(results: LoadResult[]): void {
  _bootstrapLoadResults = results;
}

/** Retorna los resultados del bootstrap para que la UI muestre badges de error. */
export function getBootstrapLoadResults(): LoadResult[] {
  return _bootstrapLoadResults;
}
