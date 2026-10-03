import { CAPABILITY, definePlugin, type PluginAPI } from "@tps/plugin-sdk";
import { FileTextIcon } from "lucide-react";

import { createDiagnosticoScreen } from "./DiagnosticoScreen";
import { desmontarEstilos, montarEstilos } from "./estilos";

/**
 * Plugin sonda de facturación.
 *
 * No factura nada: sirve para responder con EVIDENCIA qué puede hacer un plugin
 * de facturación en cada target, antes de escribirlo en serio.
 *
 * ── Por qué las capacidades están declaradas así ─────────────────────────────
 *
 * `requires` pide solo lo que existe en LOS DOS targets. Un plugin de
 * facturación bien hecho no necesita más, y la razón es de seguridad, no de
 * comodidad:
 *
 *   La firma con certificado digital y el envío al servicio de impuestos NO
 *   deben vivir acá. En web es imposible —la clave privada quedaría expuesta en
 *   el navegador— y en escritorio es mala idea: una copia del certificado por
 *   máquina de cajero. Eso va en el backend; el plugin orquesta y muestra.
 *
 * Por eso NO pide `http.external`: habla con el backend propio, que es mismo
 * origen. Pedirlo lo dejaría fuera de web sin ganar nada.
 *
 * `printing.raw` va en `optional`, no en `requires`: la impresora fiscal por
 * puerto solo existe en escritorio. Declararla como requerida excluiría el
 * plugin de web por completo, cuando el 90% de su función —emitir, consultar,
 * reimprimir por el visor— anda perfecto ahí.
 *
 * El kernel resuelve el resto: en web reporta `printing.raw` en `degraded` y el
 * plugin se adapta.
 */

const PLUGIN_ID = "com.rhleone.facturacion";

const ROUTE_ID = "facturacion.diagnostico";
const ROUTE_PATH = "/facturacion/diagnostico";

const plugin = definePlugin({
  manifest: {
    id: PLUGIN_ID,
    name: "Facturación (sonda)",
    version: "1.0.0",
    description:
      "Sonda de capacidades para el futuro plugin de facturación. Prueba contra el host real qué está disponible en cada target.",
    author: "TPS Dev",
    sdkVersion: "^0.1.0",

    // Solo lo que existe en ambos targets.
    requires: [
      CAPABILITY.VIEWS,
      CAPABILITY.NAVIGATION,
      CAPABILITY.NOTIFICATIONS,
      CAPABILITY.COMMANDS,
      CAPABILITY.STORAGE,
      CAPABILITY.EVENTS,
      CAPABILITY.HTTP,
      CAPABILITY.PRINTING,
    ],

    // Solo escritorio. Opcional para no perder el target web.
    optional: [CAPABILITY.PRINTING_RAW],
  },

  activate(api: PluginAPI): void {
    // El host no inyecta CSS de remotes (verificado en el loader de plugins).
    // El plugin se hace cargo de su propio ciclo de vida de estilos.
    montarEstilos();

    const DiagnosticoRoute = createDiagnosticoScreen(api);

    api.registerRoutes([
      {
        id: ROUTE_ID,
        path: ROUTE_PATH,
        label: "Diagnóstico",
        component: DiagnosticoRoute,
        icon: FileTextIcon,
        roles: [],
      },
    ]);

    api.registerSidebarSection({
      id: "facturacion",
      label: "Facturación",
      order: 997,
      icon: FileTextIcon,
      items: [
        {
          id: ROUTE_ID,
          path: ROUTE_PATH,
          label: "Diagnóstico",
          component: DiagnosticoRoute,
          icon: FileTextIcon,
          roles: [],
        },
      ],
    });

    // ── Comandos para abrir las pantallas: PENDIENTES del SDK ───────────────
    //
    // Acá había un `api.registerCommand(..., () => api.openRoute?.(path))`.
    // Estaba roto: `openRoute` no existe en `PluginAPI` ni lo implementa el
    // host, y el `?.` hacía que el comando no hiciera NADA sin avisar.
    //
    // El contrato del SDK no expone hoy ninguna forma de navegar:
    // `registerRoutes` y `registerSidebarSection` registran, y `getActiveTab` /
    // `onTabChange` solo leen. No hay un "abrir esta ruta".
    //
    // Se quitan en vez de dejarlos fingiendo: un comando que aparece y no
    // responde es peor que un comando ausente. La pantalla se alcanza por la
    // sección "Facturación" del sidebar, que sí funciona.
    //
    // Para reponerlos, el SDK necesita primero un método de navegación real
    // (por ejemplo `openRoute(path: string): void`) declarado en `PluginAPI` e
    // implementado por el host en `src/plugins/`.

    // La impresora por puerto no existe en web. Se consulta en vez de asumir:
    // el plugin sigue siendo útil sin ella.
    const tieneImpresoraCruda = api.hasCapability(CAPABILITY.PRINTING_RAW);

    console.info(
      `[facturacion] activo. Impresora fiscal por puerto: ${
        tieneImpresoraCruda ? "disponible" : "no disponible en este target"
      }`,
    );
  },

  deactivate(): void {
    // Simétrico a montarEstilos() en activate(): si no lo hacemos acá, el
    // <style> queda fantasma en el head del host tras desinstalar.
    desmontarEstilos();
    console.info("[facturacion] desactivado");
  },
});

export default plugin;
