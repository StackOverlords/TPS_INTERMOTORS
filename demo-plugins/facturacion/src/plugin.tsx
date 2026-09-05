import { CAPABILITY, definePlugin, type PluginAPI } from "@tps/plugin-sdk";
import { FileTextIcon } from "lucide-react";

import { createDiagnosticoScreen } from "./DiagnosticoScreen";

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
const CMD_ABRIR = "facturacion.abrirDiagnostico";

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

    api.registerCommand(CMD_ABRIR, () => {
      api.openRoute?.(ROUTE_PATH);
    });

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
    console.info("[facturacion] desactivado");
  },
});

export default plugin;
