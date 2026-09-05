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
 *   printing.raw    Solo escritorio. Impresora térmica por puerto serie/USB,
 *                   ESC/POS, cajón de dinero. El navegador no abre un puerto
 *                   sin permiso explícito del usuario POR DISPOSITIVO
 *                   (WebSerial/WebUSB, solo Chromium y solo sobre HTTPS).
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
 * Es decir: un plugin de facturación bien hecho probablemente NO necesita
 * `http.external` — necesita hablar con el backend propio, que es mismo origen.
 * Sí puede necesitar `printing.raw` para la impresora fiscal.
 */

/** Capacidades que el host ofrece en cada target. */
const CAPABILITIES_BY_TARGET: Record<PluginTarget, readonly Capability[]> = {
  desktop: [
    CAPABILITY.VIEWS,
    CAPABILITY.NAVIGATION,
    CAPABILITY.TABS,
    CAPABILITY.SETTINGS,
    CAPABILITY.NOTIFICATIONS,
    CAPABILITY.COMMANDS,
    CAPABILITY.EVENTS,
    CAPABILITY.STORAGE,
    CAPABILITY.KEYBINDINGS,
    CAPABILITY.PRINTING,
    CAPABILITY.PRINTING_RAW,
    CAPABILITY.HTTP_EXTERNAL,
    CAPABILITY.FILESYSTEM,
  ],
  web: [
    CAPABILITY.VIEWS,
    CAPABILITY.NAVIGATION,
    CAPABILITY.TABS,
    CAPABILITY.SETTINGS,
    CAPABILITY.NOTIFICATIONS,
    CAPABILITY.COMMANDS,
    CAPABILITY.EVENTS,
    CAPABILITY.STORAGE,
    CAPABILITY.KEYBINDINGS,
    CAPABILITY.PRINTING,
    // Sin PRINTING_RAW, HTTP_EXTERNAL ni FILESYSTEM: ver la nota de arriba.
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
