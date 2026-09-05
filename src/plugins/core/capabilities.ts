import {
  CAPABILITY,
  type Capability,
  type PluginManifest,
  type PluginTarget,
} from "@tps/plugin-sdk";

import { isTauriEnvironment } from "@/utils/environment";

/**
 * Compatibilidad de plugins por target.
 *
 * ── Por qué el HOST declara las capacidades, y no el plugin ──────────────────
 *
 * El manifiesto ya dice qué NECESITA un plugin (`requires`). Acá se declara qué
 * OFRECE cada target. La compatibilidad se deduce comparando las dos listas.
 *
 * La alternativa —que cada plugin declare `targets: ["desktop"]` a mano— falla
 * de dos maneras: el autor se olvida y el plugin revienta al activarse en web
 * con un error críptico adentro de Module Federation; o pone `["desktop"]` por
 * las dudas y el plugin queda excluido de web sin motivo real.
 *
 * Con esta tabla, agregar una capacidad a web mañana habilita solos a todos los
 * plugins que la pedían. Nadie toca un manifiesto.
 *
 * ── El caso que motivó esto: facturación ─────────────────────────────────────
 *
 * Un plugin de facturación necesita imprimir y hablar con el servicio de
 * impuestos. Ahí las diferencias entre targets dejan de ser teóricas:
 *
 *   printing        Los dos targets. En web sale por el visor del navegador;
 *                   en escritorio, por el del sistema.
 *
 *   printing.raw    Escritorio siempre; en web DEPENDE DEL NAVEGADOR. Se
 *                   resuelve preguntándole al navegador, no con una constante:
 *                   ver `soportaPuertosDeHardware()` más abajo.
 *
 *   http            Los dos targets: es el cliente HTTP del host, que ya lleva
 *                   el token. Es la vía para hablar con el backend propio.
 *
 *   http.external   Solo escritorio. En web rige CORS: el servicio de impuestos
 *                   tendría que autorizar el origen de la app, cosa que no va a
 *                   pasar.
 *
 * OJO con lo que esto implica para facturación electrónica: la firma con
 * certificado digital y el envío al servicio NO deberían vivir en el plugin en
 * ningún target. En web es imposible (la clave privada quedaría expuesta en el
 * navegador) y en escritorio es mala idea (una copia del certificado por
 * máquina). Eso va en el backend; el plugin orquesta y muestra.
 *
 * Es decir: un plugin de facturación bien hecho NO necesita `http.external`
 * —necesita `http` contra el backend propio— y puede necesitar `printing.raw`
 * para la impresora fiscal.
 */

/**
 * ¿Este navegador puede abrir un puerto de hardware?
 *
 * Se pregunta en vez de asumir. La sonda de facturación mostró la
 * contradicción: en Chromium `'serial' in navigator` da true mientras la tabla
 * declaraba `printing.raw: false`. El host estaba mintiendo sobre algo que el
 * navegador demostrablemente tiene.
 *
 * Lo que la detección NO garantiza: que el usuario vaya a conceder el permiso.
 * WebSerial y WebUSB lo piden POR DISPOSITIVO y dentro de un gesto. Por eso
 * `printing.raw` conviene pedirla en `optional` y no en `requires`, incluso
 * ahora que web puede ofrecerla.
 *
 * En escritorio ni se consulta: lo resuelve el host por IPC, sin el navegador
 * de por medio.
 */
function soportaPuertosDeHardware(): boolean {
  if (typeof navigator === "undefined") return false;

  // Chromium expone las dos; Firefox y Safari, ninguna.
  return "serial" in navigator || "usb" in navigator;
}

/** Lo que el host ofrece en cualquier target. */
const CAPABILIDADES_BASE: readonly Capability[] = [
  CAPABILITY.VIEWS,
  CAPABILITY.NAVIGATION,
  CAPABILITY.TABS,
  CAPABILITY.SETTINGS,
  CAPABILITY.NOTIFICATIONS,
  CAPABILITY.COMMANDS,
  CAPABILITY.EVENTS,
  CAPABILITY.STORAGE,
  CAPABILITY.KEYBINDINGS,
  CAPABILITY.HTTP,
  CAPABILITY.PRINTING,
];

/**
 * Capacidades que el host ofrece en cada target.
 *
 * Se calcula al importar el módulo, no en cada llamada: ni el target ni las
 * APIs del navegador cambian durante la vida de la página.
 */
const CAPABILITIES_BY_TARGET: Record<PluginTarget, readonly Capability[]> = {
  desktop: [
    ...CAPABILIDADES_BASE,
    CAPABILITY.PRINTING_RAW,
    CAPABILITY.HTTP_EXTERNAL,
    CAPABILITY.FILESYSTEM,
  ],
  web: [
    ...CAPABILIDADES_BASE,
    // Condicional, no fija: Chromium expone WebSerial/WebUSB y el resto no.
    // Declararla siempre haría que un plugin se activara en Firefox para
    // fallar al primer uso; declararla nunca renuncia a algo que funciona.
    ...(soportaPuertosDeHardware() ? [CAPABILITY.PRINTING_RAW] : []),
    // Sin HTTP_EXTERNAL ni FILESYSTEM: CORS y falta de acceso al disco no se
    // arreglan preguntando. Ver la nota de arriba.
  ],
};

/** Target en el que corre esta instancia del host. */
export function getCurrentTarget(): PluginTarget {
  return isTauriEnvironment() ? "desktop" : "web";
}

export function getCapabilitiesForTarget(
  target: PluginTarget,
): readonly Capability[] {
  return CAPABILITIES_BY_TARGET[target];
}

export interface CompatibilityResult {
  compatible: boolean;
  /** Capacidades requeridas que el target no ofrece. */
  missing: Capability[];
  /** Opcionales ausentes: el plugin corre, pero degradado. */
  degraded: Capability[];
  /** Motivo legible, para la UI de gestión. */
  reason?: string;
}

/**
 * Decide si un plugin puede correr en un target.
 *
 * Dos filtros, en orden:
 *  1. `targets` del manifiesto, si está — es una restricción explícita del
 *     autor y gana sobre cualquier deducción.
 *  2. `requires` contra lo que el target ofrece.
 *
 * Las `optional` que falten NO impiden la activación: se reportan en `degraded`
 * para que el plugin las consulte y se adapte.
 */
export function checkPluginCompatibility(
  manifest: PluginManifest,
  target: PluginTarget = getCurrentTarget(),
): CompatibilityResult {
  const available = new Set(getCapabilitiesForTarget(target));

  if (manifest.targets && !manifest.targets.includes(target)) {
    return {
      compatible: false,
      missing: [],
      degraded: [],
      reason: `El plugin declara soporte solo para: ${manifest.targets.join(", ")}.`,
    };
  }

  const missing = (manifest.requires ?? []).filter((c) => !available.has(c));
  const degraded = (manifest.optional ?? []).filter((c) => !available.has(c));

  if (missing.length > 0) {
    return {
      compatible: false,
      missing,
      degraded,
      reason:
        `Requiere ${missing.join(", ")}, que no está disponible en ` +
        `${target === "web" ? "la versión web" : "escritorio"}.`,
    };
  }

  return { compatible: true, missing: [], degraded };
}
