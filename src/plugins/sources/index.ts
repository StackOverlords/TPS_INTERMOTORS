/**
 * Resolución de la fuente de plugins según el target.
 *
 * Sigue el mismo patrón que `src/platform`: el kernel pide una capacidad y no
 * sabe quién la implementa. Acá la elección es en RUNTIME y no por alias de
 * build como en `platform`, por dos razones:
 *
 *  1. No hay ninguna restricción de gesto del usuario que obligue a resolver
 *     síncrono (esa es la que fuerza el alias en `platform`).
 *  2. Los dos adapters son livianos —un wrapper de `invoke` y uno de axios—,
 *     así que el peso en el bundle es irrelevante.
 *
 * Si en algún momento el adapter de escritorio crece, se lo puede mover al
 * alias `@platform-adapters` sin tocar a los consumidores.
 *
 * La detección va por `@/utils/environment` y no por `@/platform` a propósito:
 * esta rama nació antes de la capa de puertos y todavía no tiene `src/platform`.
 * Una vez rebasada sobre `development`, ese helper ya delega en `platform/env`
 * —que además chequea `__TAURI_INTERNALS__`— así que no hay nada que migrar.
 */

import { isTauriEnvironment } from '@/utils/environment';

import type { PluginSource } from './PluginSource';
import { HttpPluginSource } from './HttpPluginSource';
import { TauriPluginSource } from './TauriPluginSource';

let instance: PluginSource | null = null;

/**
 * Fuente de plugins del target activo.
 *
 * Escritorio: comandos Rust + archivos en `plugins_dir`.
 * Web: endpoints del backend + bundles servidos por HTTP.
 *
 * ⚠️ Diferencia de modelo, no solo de transporte: en escritorio cada usuario
 * instala plugins en SU máquina; en web la instalación es del lado del
 * servidor, así que los plugins pasan a ser por tenant y administrados
 * centralmente. Es una decisión de producto, no un detalle de implementación.
 */
export function getPluginSource(): PluginSource {
  if (!instance) {
    instance = isTauriEnvironment()
      ? new TauriPluginSource()
      : new HttpPluginSource();
  }
  return instance;
}

export type { ExternalPluginRef, PluginSource } from './PluginSource';
export { HttpPluginSource } from './HttpPluginSource';
export { TauriPluginSource } from './TauriPluginSource';
