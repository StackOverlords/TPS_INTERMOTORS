import { useCommands } from '@/keybindings';
import { useCallback, useRef } from 'react';
interface FilterNavigationOptions {
  onNavigateToCategoria?: () => void;
  onNavigateToDescripcion?: () => void;
  onNavigateToCodigoOem?: () => void;
  onNavigateToCodigoUniv?: () => void;
}

export const useFilterNavigation = (options: FilterNavigationOptions = {}) => {
  const {
    onNavigateToCategoria,
    onNavigateToDescripcion,
    onNavigateToCodigoOem,
    onNavigateToCodigoUniv
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  const focusNextFilter = useCallback((currentField?: string) => {
    if (!containerRef.current) return;

    const focusOrder = [
      '[data-filter="categoria"]',
      '[data-filter="descripcion"]',
      '[data-filter="codigo_oem"]',
      '[data-filter="codigo_upc"]'
    ];

    let currentIndex = -1;
    if (currentField) {
      currentIndex = focusOrder.findIndex(selector =>
        selector.includes(currentField)
      );
    }

    const nextIndex = (currentIndex + 1) % focusOrder.length;
    const nextElement = containerRef.current.querySelector(focusOrder[nextIndex]) as HTMLElement;

    if (nextElement) {
      const trigger = nextElement.querySelector('[data-radix-select-trigger]') as HTMLElement;
      const input = nextElement.querySelector('input') as HTMLInputElement;

      if (trigger) {
        trigger.focus();
      } else if (input) {
        input.focus();
      } else {
        nextElement.focus();
      }
    }
  }, []);

  // Helper to focus a specific filter by index
  const focusFilterByIndex = useCallback((index: number) => {
    if (!containerRef.current) return;

    const focusOrder = [
      '[data-filter="categoria"]',
      '[data-filter="descripcion"]',
      '[data-filter="codigo_oem"]',
      '[data-filter="codigo_upc"]'
    ];

    if (index >= 0 && index < focusOrder.length) {
      const element = containerRef.current.querySelector(focusOrder[index]) as HTMLElement;

      if (element) {
        const trigger = element.querySelector('[data-radix-select-trigger]') as HTMLElement;
        const input = element.querySelector('input') as HTMLInputElement;

        if (trigger) {
          trigger.focus();
        } else if (input) {
          input.focus();
        } else {
          element.focus();
        }
      }
    }
  }, []);

  useCommands({
    'tableAndFilters.filter1': onNavigateToCategoria || (() => focusFilterByIndex(0)),
    'tableAndFilters.filter2': onNavigateToDescripcion || (() => focusFilterByIndex(1)),
    'tableAndFilters.filter3': onNavigateToCodigoOem || (() => focusFilterByIndex(2)),
    'tableAndFilters.filter4': onNavigateToCodigoUniv || (() => focusFilterByIndex(3)),
    'tableAndFilters.nextFilter': () => {
      const activeElement = document.activeElement as HTMLElement;
      if (!containerRef.current?.contains(activeElement)) return;
      const currentFilter = activeElement.closest('[data-filter]')?.getAttribute('data-filter') || undefined;
      focusNextFilter(currentFilter);
    }
  }, {
    enableOnFormTags: true
  });

  return {
    containerRef,
    focusNextFilter
  };
};