/**
 * loadExternalPlugins — Carga plugins externos en runtime vía Module Federation.
 *
 * Generaliza el prototipo hardcodeado de `loadRemotePlugin.ts` del PoC:
 * - Pipeline: TauriPluginSource.list() → registerRemotes → loadRemote → PluginManager.register/activate
 * - Error isolation por plugin: un fallo NO tumba la carga del resto.
 * - Idempotencia garantizada en dos niveles:
 *   1. Set de remotes ya registrados (evita re-llamar registerRemotes por el mismo name).
 *   2. Guards de PluginManager.isRegistered / isActive antes de register/activate.
 *
 * ## GOTCHAS CRÍTICOS (del PoC — no negociables)
 * - `type: "module"` es OBLIGATORIO en registerRemotes. Sin él, el runtime busca
 *   window[name] y falla con RUNTIME-001 "Failed to get remoteEntry exports".
 * - El remote DEBE exponer "./plugin" como el nombre del expose en vite.config del remote.
 * - El kernel recibe la `entry` ya como URL `plugin://` (TauriPluginSource la construye
 *   internamente con `buildPluginUrl()`). No hay conversión aquí.
 *
 * @module plugins/loadExternalPlugins
 */

import { registerRemotes, loadRemote } from "@module-federation/runtime";

import { checkPluginCompatibility } from "./core/capabilities";
import type { Plugin } from "@tps/plugin-sdk";
import { logger } from "@/utils/logger";
import type { PluginSource } from "./sources/PluginSource";
import type { PluginManagerClass } from "./plugin-manager";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/**
 * Status de carga posibles para cada plugin externo procesado.
 */
const LOAD_STATUS = {
  LOADED: "loaded",
  SKIPPED: "skipped",
  FAILED: "failed",
} as const;

type LoadStatus = (typeof LOAD_STATUS)[keyof typeof LOAD_STATUS];

/**
 * Resultado de carga para un plugin externo individual.
 * El array retornado por loadExternalPlugins incluye una entrada por cada
 * plugin con `enabled === true` encontrado en la source.
 */
export interface LoadResult {
  /** ID del plugin (reverse-DNS). Disponible siempre. */
  id: string;
  /** Nombre del remote (@module-federation). Disponible siempre. */
  name: string;
  /** Resultado de la operación de carga. */
  status: LoadStatus;
  /** Error descriptivo cuando status === "failed". */
  error?: string;
}

// ---------------------------------------------------------------------------
// Estado de sesión: remotes ya registrados (idempotencia de registerRemotes)
// ---------------------------------------------------------------------------

/**
 * Set de nombres de remote ya pasados a registerRemotes en esta sesión.
 * Evita re-registrar el mismo remote si loadExternalPlugins se llama múltiples veces.
 * @module-federation/runtime tolera re-registro pero es innecesario y puede generar warnings.
 */
const registeredRemoteNames = new Set<string>();

// ---------------------------------------------------------------------------
// Implementación principal
// ---------------------------------------------------------------------------

/**
 * Carga y activa todos los plugins externos habilitados desde la fuente indicada.
 *
 * @param source  - Fuente de plugins (PluginSource). Inyectada para desacoplar
 *                  el loader de Tauri — permite mockear en tests sin tocar el kernel.
 * @param manager - Instancia del PluginManager que registra y activa los plugins.
 * @returns       Array de LoadResult con un entry por cada plugin enabled encontrado.
 *                Plugins disabled son ignorados silenciosamente (no aparecen en el resultado).
 *
 * @example
 * ```ts
 * const results = await loadExternalPlugins(new TauriPluginSource(), PluginManager);
 * const failed = results.filter(r => r.status === "failed");
 * if (failed.length > 0) {
 *   logger.warn("[loadExternalPlugins] Plugins que fallaron:", failed);
 * }
 * ```
 */
export async function loadExternalPlugins(
  source: PluginSource,
  manager: PluginManagerClass
): Promise<LoadResult[]> {
  let refs;

  try {
    refs = await source.list();
  } catch (err) {
    // Si list() falla (Rust down, permisos, etc.) logueamos y abortamos sin
    // tirar la app. El bootstrap externo es best-effort.
    logger.error("[loadExternalPlugins] Falló source.list() — no se cargarán plugins externos:", err);
    return [];
  }

  // Filtrar solo los habilitados. Disabled → ignorar silenciosamente.
  const enabledRefs = refs.filter((ref) => ref.enabled);

  if (enabledRefs.length === 0) {
    logger.info("[loadExternalPlugins] Sin plugins externos habilitados. No-op.");
    return [];
  }

  logger.info(
    `[loadExternalPlugins] Cargando ${enabledRefs.length} plugin(s) externo(s): ` +
      enabledRefs.map((r) => r.id).join(", ")
  );

  const results: LoadResult[] = [];

  for (const ref of enabledRefs) {
    const result = await loadSinglePlugin(ref, manager);
    results.push(result);
  }

  const loaded = results.filter((r) => r.status === LOAD_STATUS.LOADED).length;
  const skipped = results.filter((r) => r.status === LOAD_STATUS.SKIPPED).length;
  const failed = results.filter((r) => r.status === LOAD_STATUS.FAILED).length;

  logger.info(
    `[loadExternalPlugins] Completado — loaded: ${loaded}, skipped: ${skipped}, failed: ${failed}`
  );

  return results;
}

// ---------------------------------------------------------------------------
// Carga aislada de un plugin individual (try/catch por plugin)
// ---------------------------------------------------------------------------

/**
 * Parámetros de referencia a un plugin externo habilitado.
 * Subconjunto de ExternalPluginRef para la función interna.
 */
interface EnabledPluginRef {
  id: string;
  name: string;
  entry: string;
}

/**
 * Carga, registra y activa un único plugin externo.
 * Aísla errores: cualquier fallo retorna LoadResult con status "failed".
 * Nunca propaga excepciones — permite que el loop principal continúe.
 *
 * @param ref     - Referencia al plugin externo (id, name, entry ya como URL plugin://).
 * @param manager - Instancia del PluginManager para register/activate.
 * @returns       LoadResult para este plugin.
 */
async function loadSinglePlugin(
  ref: EnabledPluginRef,
  manager: PluginManagerClass
): Promise<LoadResult> {
  const { id, name, entry } = ref;

  try {
    // ── 1. Registrar remote (idempotente via Set) ─────────────────────────────
    // GOTCHA: type: "module" ES OBLIGATORIO para remoteEntry ESM generado por
    // @module-federation/vite. Sin él → RUNTIME-001 "Failed to get remoteEntry exports".
    if (!registeredRemoteNames.has(name)) {
      registerRemotes([{ name, entry, type: "module" }]);
      registeredRemoteNames.add(name);
      logger.info(`[loadExternalPlugins] Remote registrado: "${name}" → ${entry}`);
    }

    // ── 2. Cargar el módulo del remote ────────────────────────────────────────
    // El remote DEBE exponer "./plugin" en su vite.config.
    // loadRemote<T> retorna T | null | undefined según el runtime.
    const mod = await loadRemote<{ default: Plugin }>(`${name}/plugin`);

    if (!mod?.default) {
      return {
        id,
        name,
        status: LOAD_STATUS.FAILED,
        error:
          `El remote "${name}/plugin" no expone un Plugin default. ` +
          `Verificá que el vite.config.ts del remoto exponga "./plugin" ` +
          `y que el archivo exporte \`export default plugin\` (definePlugin()).`,
      };
    }

    const plugin = mod.default;

    // ── 3. Validar manifest básico ────────────────────────────────────────────
    if (!plugin.manifest?.id) {
      return {
        id,
        name,
        status: LOAD_STATUS.FAILED,
        error:
          `Plugin cargado desde "${name}" no tiene manifest.id válido. ` +
          `Usá definePlugin() con un manifest completo.`,
      };
    }

    const pluginId = plugin.manifest.id;

    // ── 3.5 Compatibilidad con el target ──────────────────────────────────────
    //
    // Un plugin puede pedir capacidades que este target no ofrece: impresora
    // por puerto serie, HTTP a terceros, filesystem. En escritorio existen; en
    // web no. Sin este filtro el plugin se activaría igual y reventaría al
    // primer uso, con un error críptico adentro de Module Federation.
    //
    // Se marca SKIPPED, no FAILED: no está roto, simplemente no aplica acá. La
    // UI de gestión lo muestra con el motivo en vez de como un error.
    //
    // El chequeo va DESPUÉS de loadRemote porque el manifiesto viaja dentro del
    // bundle. Para filtrarlo antes de la descarga, el backend tendría que
    // exponer `requires` y `targets` en el listado; hoy no lo hace.
    const compat = checkPluginCompatibility(plugin.manifest);

    if (!compat.compatible) {
      logger.info(
        `[loadExternalPlugins] Plugin "${pluginId}" omitido: ${compat.reason}`
      );
      return {
        id: pluginId,
        name,
        status: LOAD_STATUS.SKIPPED,
        error: compat.reason,
      };
    }

    if (compat.degraded.length > 0) {
      // El plugin corre igual: declaró estas como opcionales.
      logger.warn(
        `[loadExternalPlugins] Plugin "${pluginId}" corre sin ` +
          `${compat.degraded.join(", ")} en este target.`
      );
    }

    // ── 4. Guard de idempotencia: register ────────────────────────────────────
    if (manager.isRegistered(pluginId)) {
      logger.info(
        `[loadExternalPlugins] Plugin "${pluginId}" ya registrado — saltando register.`
      );
    } else {
      manager.register(plugin);

      // Verificar que register no lo rechazó (sdkVersion incompatible, dep faltante, etc.)
      if (!manager.isRegistered(pluginId)) {
        return {
          id: pluginId,
          name,
          status: LOAD_STATUS.FAILED,
          error:
            `PluginManager rechazó el plugin "${pluginId}". ` +
            `Causas posibles: sdkVersion incompatible (debe ser "^0.x.x"), ` +
            `dependencia no registrada, o manifest inválido. ` +
            `sdkVersion declarada: "${plugin.manifest.sdkVersion}".`,
        };
      }
    }

    // ── 5. Guard de idempotencia: activate ────────────────────────────────────
    if (manager.isActive(pluginId)) {
      logger.info(
        `[loadExternalPlugins] Plugin "${pluginId}" ya activo — saltando activate.`
      );
      return { id: pluginId, name, status: LOAD_STATUS.SKIPPED };
    }

    await manager.activate(pluginId);

    // Verificar activación exitosa (capability negotiation puede rechazar)
    if (!manager.isActive(pluginId)) {
      return {
        id: pluginId,
        name,
        status: LOAD_STATUS.FAILED,
        error:
          `El plugin "${pluginId}" fue registrado pero no pudo activarse. ` +
          `Causas posibles: capabilities requeridas no disponibles ` +
          `[${plugin.manifest.requires?.join(", ") ?? "ninguna"}], ` +
          `o error en plugin.activate(api).`,
      };
    }

    logger.info(
      `[loadExternalPlugins] Plugin "${pluginId}" (${plugin.manifest.name}) cargado y activado.`
    );

    return { id: pluginId, name, status: LOAD_STATUS.LOADED };
  } catch (err) {
    // Captura fallos de red (remoteEntry inaccesible), errores de MF runtime,
    // excepciones en plugin.activate(), etc.
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[loadExternalPlugins] Error cargando plugin "${id}" (remote: "${name}"):`, err);
    return {
      id,
      name,
      status: LOAD_STATUS.FAILED,
      error: message,
    };
  }
}
