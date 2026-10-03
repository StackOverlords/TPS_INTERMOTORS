/**
 * Arranque de los plugins externos (Module Federation).
 *
 * Reemplaza la cadena de `import()` que había en main.tsx, que tenía dos
 * problemas:
 *
 * - **Los módulos se pedían de a uno.** loader → fuentes → manager →
 *   resultados: cuatro viajes en serie antes de pedir siquiera la lista de
 *   plugins. Acá se piden juntos.
 *
 * - **En web, sin sesión, los plugins no aparecían nunca.** La lista sale del
 *   backend y necesita el token. Si la app arrancaba en el login, `list()`
 *   recibía 401, la carga terminaba vacía y nadie la repetía: el usuario
 *   iniciaba sesión y no veía sus plugins hasta recargar la página. Ahora en
 *   web se espera a que haya sesión y se carga en cada inicio de sesión.
 *
 * En escritorio no cambia nada: la lista se lee del disco por IPC, sin token,
 * así que se carga apenas arranca la app, igual que antes.
 *
 * Cargar de nuevo es seguro: `loadExternalPlugins` saltea lo que ya está
 * registrado o activo, y solo suma lo nuevo (p. ej. plugins que el backend
 * habilita para otra sucursal o usuario).
 */

import authSDK from "@/services/sdk-simple-auth";
import { logger } from "@/utils/logger";
import { getCurrentTarget } from "./core/capabilities";

let inFlight: Promise<void> | null = null;

async function loadNow(): Promise<void> {
  const [{ loadExternalPlugins }, { getPluginSource }, { PluginManager }, { setBootstrapLoadResults }] =
    await Promise.all([
      import("./loadExternalPlugins"),
      // La fuente la resuelve el target: comandos Rust en escritorio, endpoints
      // del backend en web. El pipeline de carga es el mismo en los dos.
      import("./sources"),
      import("./plugin-manager"),
      // Módulo liviano: no arrastra la pantalla PluginSettings.
      import("./bootstrapLoadResults"),
    ]);

  const results = await loadExternalPlugins(getPluginSource(), PluginManager);

  // Exponer los resultados a la UI de gestión (badges de error de carga).
  setBootstrapLoadResults(results);
  const failed = results.filter((r) => r.status === "failed");
  if (failed.length > 0) {
    logger.warn("[external-plugins] Plugins con error:", failed);
  }
}

/** Una carga a la vez: si ya hay una en curso, se reutiliza. */
function load(): Promise<void> {
  inFlight ??= loadNow()
    .catch((error: unknown) => {
      logger.error("[external-plugins] bootstrap failed:", error);
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * Llamar una vez al arrancar (main.tsx). Best-effort: los errores quedan en el
 * log y en los resultados de carga, nunca tumban la app.
 */
export function startExternalPlugins(): void {
  if (getCurrentTarget() === "desktop") {
    void load();
    return;
  }

  // Web: cargar cuando haya sesión, y de nuevo en cada inicio de sesión.
  let loadedForSession = false;
  const onSession = (hasUser: boolean) => {
    if (!hasUser) {
      loadedForSession = false;
      return;
    }
    if (loadedForSession) return;
    loadedForSession = true;
    void load();
  };

  // `ready` espera a que el SDK restaure la sesión guardada (IndexedDB).
  void authSDK.ready.then(() => onSession(Boolean(authSDK.getState().user)));
  authSDK.onAuthStateChanged((state) => onSession(Boolean(state.user)));
}
