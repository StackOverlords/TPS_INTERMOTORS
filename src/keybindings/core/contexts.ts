import type { ExecutionContext } from './types';

/**
 * Evaluador de contextos de ejecución para comandos
 * Inspirado en el sistema "when" de VSCode
 */

interface ContextState {
  formFocus: boolean;
  modalOpen: boolean;
  tableFocus: boolean;
  editorFocus: boolean;
}

/**
 * Estado global de contextos
 */
let currentContext: ContextState = {
  formFocus: false,
  modalOpen: false,
  tableFocus: false,
  editorFocus: false,
};

/**
 * Listeners para cambios de contexto
 */
type ContextChangeListener = (context: ContextState) => void;
const contextListeners = new Set<ContextChangeListener>();

/**
 * Actualiza el estado de un contexto
 */
export function setContext(context: ExecutionContext, value: boolean): void {
  if (context === 'global') return; // 'global' siempre está activo

  currentContext = {
    ...currentContext,
    [context]: value,
  };

  // Notificar a listeners
  contextListeners.forEach(listener => listener(currentContext));
}

/**
 * Obtiene el estado actual de un contexto
 */
export function getContext(context: ExecutionContext): boolean {
  if (context === 'global') return true;
  return currentContext[context] || false;
}

/**
 * Obtiene el estado completo de contextos
 */
export function getAllContexts(): ContextState {
  return { ...currentContext };
}

/**
 * Suscribirse a cambios en contextos
 */
export function subscribeToContextChanges(listener: ContextChangeListener): () => void {
  contextListeners.add(listener);
  return () => contextListeners.delete(listener);
}

/**
 * Evalúa una expresión "when" contra el contexto actual
 * Soporta operadores: &&, ||, !
 *
 * Ejemplos:
 * - "formFocus" → true si formFocus está activo
 * - "modalOpen && !formFocus" → true si modal está abierto y NO hay foco en form
 * - "formFocus || tableFocus" → true si cualquiera está activo
 * - "global" → siempre true
 */
export function evaluateWhenClause(whenClause: string | undefined): boolean {
  if (!whenClause || whenClause === 'global') return true;

  // Eliminar espacios extras
  const normalized = whenClause.trim();

  // Manejar operador OR (||)
  if (normalized.includes('||')) {
    return normalized
      .split('||')
      .some(part => evaluateWhenClause(part.trim()));
  }

  // Manejar operador AND (&&)
  if (normalized.includes('&&')) {
    return normalized
      .split('&&')
      .every(part => evaluateWhenClause(part.trim()));
  }

  // Manejar negación (!)
  if (normalized.startsWith('!')) {
    const context = normalized.slice(1).trim() as ExecutionContext;
    return !getContext(context);
  }

  // Contexto simple
  return getContext(normalized as ExecutionContext);
}

/**
 * Hook helper para marcar un componente con un contexto
 * Útil para marcar formularios, modales, tablas, etc.
 */
export function useContextMarker(context: ExecutionContext, enabled: boolean = true): void {
  if (typeof window === 'undefined') return;

  // Activar contexto al montar
  if (enabled) {
    setContext(context, true);
  }

  // Cleanup al desmontar
  return () => {
    if (enabled) {
      setContext(context, false);
    }
  };
}

/**
 * Resetea todos los contextos (útil para testing)
 */
export function resetContexts(): void {
  currentContext = {
    formFocus: false,
    modalOpen: false,
    tableFocus: false,
    editorFocus: false,
  };
}
