import { useEffect } from 'react';

interface UseFormEnterNavigationOptions {
  //Si es true, al presionar Enter en el último campo se ejecutará el callback onSubmit
  // default false
  submitOnLastField?: boolean;

  /**
   * Callback que se ejecuta cuando se presiona Enter en el último campo
   */
  onSubmit?: () => void;

  // Selectores CSS de elementos que NO deben participar en la navegación con Enter
  // Por ejemplo: ['.no-enter-nav', '#special-input']
  // @default []
  excludeSelectors?: string[];

  /**
   * Selectores CSS de elementos que SÍ deben participar en la navegación con Enter (lista blanca)
   * Si se especifica, SOLO estos elementos participarán en la navegación
   * Por ejemplo: ['[data-form-nav]', '[name^="field-"]', '#input1, #input2']
   * Nota: Si se usa includeSelectors, excludeSelectors se ignora
   * @default undefined
   */
  includeSelectors?: string[];

  // Si es true, el hook está activo. Si es false, no hace nada.
  // @default true
  enabled?: boolean;

  // Contenedor donde se aplicará el listener. Si no se especifica, se usa document
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const useFormEnterNavigation = (options: UseFormEnterNavigationOptions = {}) => {
  const {
    submitOnLastField = false,
    onSubmit,
    excludeSelectors = [],
    includeSelectors,
    enabled = true,
    containerRef,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef?.current || document;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Solo manejar eventos de Enter
      if (event.key !== 'Enter') return;

      // Verificar si el elemento es un input, textarea, button o combobox input
      const isInput = target.tagName === 'INPUT' && target.getAttribute('type') !== 'submit';
      const isTextarea = target.tagName === 'TEXTAREA';
      const isButton = target.tagName === 'BUTTON' && target.getAttribute('type') === 'button' && !target.hasAttribute('aria-haspopup');
      // Headless UI ComboboxInput es un input normal dentro de un Combobox
      const isComboboxInput = isInput && target.closest('[data-headlessui-state]') !== null;

      if (!isInput && !isTextarea && !isButton) return;

      // IMPORTANTE: Para combobox, verificar si el dropdown está abierto
      // Si está abierto, no navegamos (dejamos que el combobox maneje el Enter)
      // El combobox maneja su propia navegación después de seleccionar
      if (isComboboxInput) {
        const parent = target.closest('[data-headlessui-state]');
        const isExpanded = parent?.getAttribute('data-headlessui-state')?.includes('open');

        // Si el dropdown está abierto, no hacemos nada (Headless UI lo maneja)
        if (isExpanded) return;

        // Si el dropdown está cerrado, el combobox maneja su propia navegación
        // después de seleccionar, así que también retornamos
        return;
      }

      // Si hay includeSelectors (lista blanca), verificar que el elemento esté incluido
      if (includeSelectors && includeSelectors.length > 0) {
        const isIncluded = includeSelectors.some(selector => {
          try {
            return target.matches(selector) || target.closest(selector);
          } catch {
            return false;
          }
        });

        // Si no está en la lista blanca, ignorar
        if (!isIncluded) return;
      } else {
        // Si NO hay includeSelectors, usar el sistema de excludeSelectors (lista negra)
        const isExcluded = excludeSelectors.some(selector => {
          try {
            return target.matches(selector) || target.closest(selector);
          } catch {
            return false;
          }
        });

        if (isExcluded) return;
      }

      // Para textarea, permitir Enter solo si tiene una sola fila (rows === 1)
      if (isTextarea) {
        const rows = parseInt(target.getAttribute('rows') || '1', 10);
        // Si tiene más de 1 fila, permitir Enter normal (salto de línea)
        if (rows > 1) return;
      }

      // Obtener todos los elementos focusables en el formulario
      let focusableElements: HTMLElement[];

      if (includeSelectors && includeSelectors.length > 0) {
        // Si hay includeSelectors, buscar SOLO esos elementos
        focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(includeSelectors.join(', '))
        );
      } else {
        // Si NO hay includeSelectors, buscar todos los elementos focusables por defecto
        focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(
            'input:not([type="hidden"]):not([disabled]):not([type="file"]):not([type="submit"]):not([type="reset"]), ' +
            'textarea:not([disabled]), ' +
            'button[type="submit"]:not([disabled]), ' +
            'button[type="button"]:not([disabled]):not([aria-haspopup="dialog"])'
          )
        );
      }

      // Filtrar elementos visibles y aplicar include/exclude
      const visibleFocusableElements = focusableElements.filter(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;

        // Si hay includeSelectors, ya están filtrados en la consulta inicial
        if (includeSelectors && includeSelectors.length > 0) {
          return isVisible;
        }

        // Si NO hay includeSelectors, aplicar excludeSelectors
        const isExcluded = excludeSelectors.some(selector => {
          try {
            return el.matches(selector) || el.closest(selector);
          } catch {
            return false;
          }
        });

        return isVisible && !isExcluded;
      });

      // Encontrar el índice del elemento actual
      const currentIndex = visibleFocusableElements.findIndex(el => el === target);

      if (currentIndex === -1) return;

      // Verificar si estamos en el último campo
      const isLastField = currentIndex === visibleFocusableElements.length - 1;

      if (isLastField) {
        // Si estamos en el último campo y submitOnLastField es true
        if (submitOnLastField && onSubmit) {
          event.preventDefault();
          onSubmit();
        } else {
          // Si hay containerRef, volver al primer elemento (dar la vuelta)
          if (containerRef?.current && visibleFocusableElements.length > 0) {
            event.preventDefault();
            const firstElement = visibleFocusableElements[0];
            setTimeout(() => {
              firstElement.focus();

              // Si el primer elemento es un input de texto, seleccionar todo el contenido
              if (firstElement instanceof HTMLInputElement &&
                  (firstElement.type === 'text' || firstElement.type === 'number' || firstElement.type === 'date')) {
                firstElement.select();
              }
            }, 0);
          }
        }
        return;
      }

      // Prevenir el comportamiento por defecto del Enter
      event.preventDefault();

      // Navegar al siguiente elemento
      const nextElement = visibleFocusableElements[currentIndex + 1];

      if (nextElement) {
        // Pequeño timeout para asegurar que el focus funcione correctamente
        setTimeout(() => {
          nextElement.focus();

          // Si el siguiente elemento es un input de texto, seleccionar todo el contenido
          if (nextElement instanceof HTMLInputElement &&
              (nextElement.type === 'text' || nextElement.type === 'number' || nextElement.type === 'date')) {
            nextElement.select();
          }
        }, 0);
      }
    };

    container.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabled, submitOnLastField, onSubmit, excludeSelectors, includeSelectors, containerRef]);
};
