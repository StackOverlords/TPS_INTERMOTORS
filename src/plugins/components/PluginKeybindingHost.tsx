/**
 * PluginKeybindingHost — Listener global de teclado para keybindings de plugins.
 *
 * RESPONSABILIDADES:
 * - Montar UN listener global `keydown` en `window` que atiende ÚNICAMENTE los
 *   keybindings registrados por plugins vía `api.registerKeybinding()`.
 * - Sincronizarse con el registry del PluginManager (pluginKeybindings) vía
 *   `useSyncExternalStore` para re-levantar el listener cuando el registry muta.
 * - NO interferir con el sistema de keybindings nativo de TPS (react-hotkeys-hook +
 *   Zustand). Este componente corre 100% en paralelo y aislado.
 *
 * REGLAS DE SEGURIDAD (no robar eventos):
 * 1. Si el elemento en foco es un input/textarea/select/contenteditable y el binding
 *    NO declara `when: "enableOnFormTags"`, el evento se ignora.
 * 2. Solo se llama `event.preventDefault()` cuando hay un match — nunca globalmente.
 * 3. Si el plugin no tiene el command registrado en el PluginManager, el binding
 *    no dispara (el executeCommand interno loguea un warning y no-op).
 *
 * PARSING DE TECLAS:
 * Usa `parseKeyboardEvent` de `src/keybindings/utils/parser.ts` (el mismo sistema
 * que el keyring nativo de TPS) para normalizar el KeyboardEvent a string.
 * El formato esperado en `KeybindingDeclaration.key` es el mismo que COMMANDS:
 *   "ctrl+s", "alt+shift+p", "ctrl+k", etc. — normalizado a lowercase sin espacios.
 *
 * MONTAJE:
 * Se monta UNA sola vez en main.tsx junto a `<PluginDialogHost />`, dentro de los
 * providers globales. No tiene estado propio — solo efectos reactivos.
 *
 * @example
 * // En main.tsx, dentro de <TooltipProvider>:
 * <Toaster />
 * <PluginDialogHost />
 * <PluginKeybindingHost />
 */

import { useEffect, useSyncExternalStore } from "react";
import { PluginManager } from "@/plugins/plugin-manager";
import { parseKeyboardEvent, normalizeKeys } from "@/keybindings/utils/parser";
import { logger } from "@/utils/logger";

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

/** Tags de elementos de formulario donde los atajos deben silenciarse por defecto. */
const FORM_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Verifica si el elemento actualmente enfocado es un campo de formulario
 * o un elemento contenteditable.
 */
function isFormTagFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  if (FORM_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

// ---------------------------------------------------------------------------
// PluginKeybindingHost
// ---------------------------------------------------------------------------

/**
 * Host singleton para keybindings de plugins.
 * Montar una sola vez en main.tsx.
 *
 * No renderiza nada (retorna null siempre).
 * Su único efecto es el listener global de keydown.
 */
export function PluginKeybindingHost(): null {
  // Suscribirse al registry del PluginManager para re-sincronizar cuando cambia.
  // useSyncExternalStore garantiza que el efecto de abajo se re-ejecute cuando
  // el registry muta (nuevo plugin activado, plugin desactivado, etc.).
  const keybindingsRegistry = useSyncExternalStore(
    (listener) => PluginManager.subscribeKeybindings(listener),
    () => PluginManager.getPluginKeybindings()
  );

  useEffect(() => {
    // Si no hay keybindings de plugins registrados, no montamos nada.
    if (keybindingsRegistry.size === 0) return;

    // Pre-computar el mapa normalizado key→entry para O(1) lookup en el listener.
    // Usamos normalizeKeys() del mismo utils que el sistema nativo de TPS.
    const normalizedMap = new Map<string, { handler: () => void | Promise<void>; when?: string }>();

    for (const [, entry] of keybindingsRegistry) {
      const normalized = normalizeKeys(entry.decl.key);
      normalizedMap.set(normalized, {
        handler: entry.handler,
        when: entry.decl.when,
      });
    }

    function handleKeyDown(event: KeyboardEvent): void {
      // Ignorar solo teclas modificadoras presionadas solas
      const key = event.key;
      if (key === "Control" || key === "Alt" || key === "Shift" || key === "Meta") return;

      const pressed = normalizeKeys(parseKeyboardEvent(event));
      if (!pressed) return;

      const match = normalizedMap.get(pressed);
      if (!match) return;

      // Regla de seguridad: si hay foco en un form tag y el binding no declara
      // enableOnFormTags / when incluye formFocus, ignorar.
      // Convención: si `when` contiene "enableOnFormTags", permitir en form tags.
      const allowInFormTags = match.when?.includes("enableOnFormTags") ?? false;
      if (isFormTagFocused() && !allowInFormTags) return;

      // Match encontrado — prevenir el evento nativo y ejecutar el handler.
      event.preventDefault();
      event.stopPropagation();

      try {
        void Promise.resolve(match.handler());
      } catch (error) {
        logger.error("[PluginKeybindingHost] Error ejecutando keybinding de plugin:", error);
      }
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [keybindingsRegistry]);

  return null;
}
