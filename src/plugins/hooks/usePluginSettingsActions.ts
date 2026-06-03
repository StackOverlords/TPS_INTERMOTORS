/**
 * usePluginSettingsActions — Hook reactivo para las acciones de settings de plugins.
 *
 * Gemelo de usePluginSidebarSections para las SettingsAction del footer del sidebar.
 * Mismo patrón: useSyncExternalStore + subscribeUI() + caché estable.
 *
 * Uso:
 * ```tsx
 * const pluginActions = usePluginSettingsActions();
 * // pluginActions es SettingsAction[] — lista de acciones aportadas por plugins activos.
 * ```
 */

import { useSyncExternalStore } from "react";
import type { SettingsAction } from "@tps/plugin-sdk";
import { PluginManager } from "@/plugins/plugin-manager";

/**
 * Devuelve el array de acciones de settings aportadas por plugins activos,
 * actualizándose reactivamente cuando se registran o desactivan plugins.
 *
 * La referencia del array es estable mientras no haya mutación —
 * misma referencia = React omite el re-render.
 *
 * @returns SettingsAction[] — Lista de acciones de settings de plugins.
 */
export function usePluginSettingsActions(): SettingsAction[] {
  return useSyncExternalStore(
    (onStoreChange) => PluginManager.subscribeUI(onStoreChange),
    () => PluginManager.getSettingsActions(),
    () => PluginManager.getSettingsActions(),
  );
}
