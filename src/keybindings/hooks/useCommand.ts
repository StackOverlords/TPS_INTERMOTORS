/**
 * Hook universal para keybindings
 * Reemplaza todos los hooks específicos (useBasicFormKeybindings, useFormKeybindings, etc.)
 */

import { useHotkeys } from 'react-hotkeys-hook';
import type { CommandId } from '../core/commands';
import { evaluateWhenClause } from '../core/contexts';
import type { UseCommandOptions } from '../core/types';
import { useKeybindingKeys } from '../store/keybindingStore';

export interface UseCommandOptionsExtended extends UseCommandOptions {
  /**
   * Habilitar/deshabilitar dinámicamente el comando
   * Útil para comandos que solo deben ejecutarse en ciertas condiciones
   */
  enabled?: boolean;
}

/**
 * Hook principal para registrar comandos con keybindings
 *
 * @example
 * ```tsx
 * // En un formulario
 * useCommand('forms.save', handleSave);
 * useCommand('forms.reset', handleReset);
 * useCommand('forms.cancel', handleCancel);
 *
 * // En una tabla
 * useCommand('table.nextRow', selectNextRow);
 * useCommand('table.prevRow', selectPrevRow);
 *
 * // Acciones globales
 * useCommand('actions.commandPalette', openCommandPalette);
 * ```
 */
export function useCommand(
  commandId: CommandId,
  handler: () => void,
  options: UseCommandOptions = {}
): void {
  // Obtener las teclas del store (reactivo)
  const keys = useKeybindingKeys(commandId);

  const {
    enabled = true,
    enableOnFormTags = false,
    preventDefault = true,
  } = options;

  // Registrar el hotkey
  useHotkeys(
    keys,
    (event) => {
      if (preventDefault) {
        event.preventDefault();
      }
      handler();
    },
    {
      enabled,
      enableOnFormTags,
    },
    [keys, handler, enabled]
  );
}

/**
 * Hook para comandos con contexto "when"
 * Solo se ejecuta si el contexto está activo
 *
 * @example
 * ```tsx
 * useConditionalCommand('forms.save', handleSave, {
 *   when: 'formFocus && !modalOpen'
 * });
 * ```
 */
export function useConditionalCommand(
  commandId: CommandId,
  handler: () => void,
  options: UseCommandOptions & { when?: string } = {}
): void {
  const keys = useKeybindingKeys(commandId);

  const {
    enabled = true,
    enableOnFormTags = false,
    preventDefault = true,
    when,
  } = options;

  // Evaluar la condición "when"
  const isContextActive = when ? evaluateWhenClause(when) : true;

  useHotkeys(
    keys,
    (event) => {
      if (!isContextActive) return;

      if (preventDefault) {
        event.preventDefault();
      }
      handler();
    },
    {
      enabled: enabled && isContextActive,
      enableOnFormTags,
    },
    [keys, handler, enabled, isContextActive]
  );
}

/**
 * Hook para múltiples comandos
 * Útil cuando necesitas registrar varios comandos a la vez
 *
 * @example
 * ```tsx
 * useCommands({
 *   'forms.save': handleSave,
 *   'forms.reset': handleReset,
 *   'forms.cancel': handleCancel,
 * });
 * ```
 */
export function useCommands(
  commands: Partial<Record<CommandId, () => void>>,
  options: UseCommandOptions = {}
): void {
  for (const [commandId, handler] of Object.entries(commands)) {
    if (handler) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useCommand(commandId as CommandId, handler, options);
    }
  }
}

/**
 * Hook para obtener solo las teclas de un comando (sin registrar handler)
 * Útil para mostrar en UI
 *
 * @example
 * ```tsx
 * const saveKeys = useCommandKeys('forms.save');
 * return <span>Presiona {saveKeys} para guardar</span>;
 * ```
 */
export function useCommandKeys(commandId: CommandId): string {
  return useKeybindingKeys(commandId);
}
