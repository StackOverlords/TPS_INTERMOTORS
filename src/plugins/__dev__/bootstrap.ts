/**
 * bootstrapDevPlugins — Carga y activa plugins de prueba SOLO en modo dev.
 *
 * Se ejecuta únicamente cuando VITE_DEV_PLUGINS=1.
 * Idempotente: no re-registra si el plugin ya está registrado.
 * Errores del plugin NO tumban la app (try/catch + console.error).
 *
 * Uso desde main.tsx:
 * ```ts
 * if (import.meta.env.VITE_DEV_PLUGINS === "1") {
 *   bootstrapDevPlugins().catch((e) => console.error("[dev-plugins] bootstrap failed:", e));
 * }
 * ```
 *
 * @module __dev__/bootstrap
 */

import { PluginManager } from "@/plugins/plugin-manager";
import { helloPlugin } from "./helloPlugin/index";

/**
 * Registra y activa todos los plugins de desarrollo.
 * Idempotente: si un plugin ya está registrado, lo omite (PluginManager.isRegistered).
 */
export async function bootstrapDevPlugins(): Promise<void> {
  const plugins = [helloPlugin];

  for (const plugin of plugins) {
    const id = plugin.manifest.id;
    try {
      if (PluginManager.isRegistered(id)) {
        console.log(`[dev-plugins] already registered, skipping: ${id}`);
        continue;
      }

      PluginManager.register(plugin);
      await PluginManager.activate(id);

      console.log(`[dev-plugins] registered+activated: ${id}`);
    } catch (e) {
      console.error(`[dev-plugins] failed to load plugin "${id}":`, e);
    }
  }
}
