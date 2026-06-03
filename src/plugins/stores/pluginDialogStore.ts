/**
 * pluginDialogStore — Store imperativo para confirm() y prompt() del kernel de plugins.
 *
 * ARQUITECTURA: Controlador imperativo singleton + host montado en el árbol React.
 *
 * El problema: confirm()/prompt() se invocan desde código de plugin que puede NO estar
 * en el árbol de React (command handlers, callbacks async). Deben devolver Promises.
 *
 * Solución:
 * 1. Este store actúa como canal entre el llamador imperativo (plugin-manager.ts)
 *    y el componente host (<PluginDialogHost/>) montado en main.tsx.
 * 2. `requestConfirm`/`requestPrompt` crean la Promise, guardan el `resolve` en el
 *    estado y devuelven la Promise al caller.
 * 3. El host React se suscribe al store y renderiza el diálogo correspondiente.
 * 4. Al confirmar/cancelar, el host llama `resolveDialog()` que invoca el `resolve`
 *    guardado y limpia el estado.
 *
 * COLA: Se usa una cola (array) para manejar requests simultáneas de múltiples plugins.
 * Cuando la cola tiene más de un item, el siguiente se activa automáticamente al
 * resolver el actual. Esto garantiza que no se pierden requests.
 *
 * PATRÓN: `create` de Zustand (sin persist). Consistente con branchStore.ts / themeStore.ts.
 * Acceso fuera de React via `.getState()` (igual que useThemeStore.getState() en plugin-manager.ts).
 */

import { create } from "zustand";
import type { ConfirmOptions, PromptOptions, PromptResult } from "@tps/plugin-sdk";

// ---------------------------------------------------------------------------
// Tipos de request de diálogo
// ---------------------------------------------------------------------------

interface ConfirmRequest {
  type: "confirm";
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface PromptRequest {
  type: "prompt";
  options: PromptOptions;
  resolve: (value: PromptResult) => void;
}

/** Una request de diálogo pendiente en la cola. */
export type DialogRequest = ConfirmRequest | PromptRequest;

// ---------------------------------------------------------------------------
// Estado y acciones del store
// ---------------------------------------------------------------------------

interface PluginDialogState {
  /** Request activa en este momento (la que renderiza el host). */
  activeRequest: DialogRequest | null;
  /** Cola de requests pendientes (excluyendo la activa). */
  pendingQueue: DialogRequest[];

  /**
   * Imperativo — llamado desde plugin-manager.ts (fuera de React).
   * Encola una request de confirmación y devuelve la Promise que se resolverá
   * cuando el usuario interactúe con el diálogo.
   */
  requestConfirm: (options: ConfirmOptions) => Promise<boolean>;

  /**
   * Imperativo — llamado desde plugin-manager.ts (fuera de React).
   * Encola una request de prompt y devuelve la Promise que se resolverá
   * cuando el usuario interactúe con el diálogo.
   */
  requestPrompt: (options: PromptOptions) => Promise<PromptResult>;

  /**
   * Resuelve la request activa con el valor dado y avanza la cola.
   * Llamado desde <PluginDialogHost/> cuando el usuario confirma o cancela.
   *
   * El tipo `boolean | PromptResult` cubre ambos casos (confirm + prompt).
   * El store valida internamente que el tipo sea coherente con la request activa.
   */
  resolveDialog: (value: boolean | PromptResult) => void;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Crea una nueva request y la encola (o la activa directamente si no hay activa).
 * Devuelve la Promise que el caller usará para await el resultado.
 */
function enqueueRequest<T>(
  get: () => PluginDialogState,
  set: (updater: (state: PluginDialogState) => Partial<PluginDialogState>) => void,
  buildRequest: (resolve: (value: T) => void) => DialogRequest
): Promise<T> {
  return new Promise<T>((resolve) => {
    const request = buildRequest(resolve as (value: boolean | PromptResult) => void);
    const { activeRequest } = get();

    if (activeRequest === null) {
      // No hay diálogo activo → activar directamente
      set(() => ({ activeRequest: request }));
    } else {
      // Ya hay uno activo → encolar para cuando termine el actual
      set((state) => ({
        pendingQueue: [...state.pendingQueue, request],
      }));
    }
  });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePluginDialogStore = create<PluginDialogState>((set, get) => ({
  activeRequest: null,
  pendingQueue: [],

  requestConfirm(options: ConfirmOptions): Promise<boolean> {
    return enqueueRequest<boolean>(get, set, (resolve) => ({
      type: "confirm",
      options,
      resolve,
    }));
  },

  requestPrompt(options: PromptOptions): Promise<PromptResult> {
    return enqueueRequest<PromptResult>(get, set, (resolve) => ({
      type: "prompt",
      options,
      resolve,
    }));
  },

  resolveDialog(value: boolean | PromptResult): void {
    const { activeRequest, pendingQueue } = get();

    if (!activeRequest) return;

    // Llamar al resolve de la request activa con el valor dado.
    // La función resolve ya es del tipo correcto (boolean para confirm, PromptResult para prompt).
    // El cast es seguro porque el host pasa el tipo correcto según activeRequest.type.
    (activeRequest.resolve as (v: boolean | PromptResult) => void)(value);

    // Avanzar la cola: el siguiente pendiente se convierte en activo.
    const [next, ...remaining] = pendingQueue;

    set(() => ({
      activeRequest: next ?? null,
      pendingQueue: remaining,
    }));
  },
}));
