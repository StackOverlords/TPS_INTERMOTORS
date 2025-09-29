import { useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

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

  // Helper function to focus the next filter in order
  const focusNextFilter = (currentField?: string) => {
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
      // Handle ComboboxSelect vs Input elements differently
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
  };

  // Tab navigation within filters
  useHotkeys('tab', (e) => {
    const activeElement = document.activeElement as HTMLElement;
    if (!containerRef.current?.contains(activeElement)) return;

    e.preventDefault();

    // Determine current filter based on active element
    const currentFilter = activeElement.closest('[data-filter]')?.getAttribute('data-filter') || undefined;
    focusNextFilter(currentFilter);
  }, {
    enableOnFormTags: true,
    enabled: true
  });

  // Keyboard shortcuts for direct navigation
  useHotkeys('ctrl+1', (e) => {
    e.preventDefault();
    if (onNavigateToCategoria) {
      onNavigateToCategoria();
    } else {
      focusNextFilter(); // Focus first filter (categoria)
    }
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+2', (e) => {
    e.preventDefault();
    if (onNavigateToDescripcion) {
      onNavigateToDescripcion();
    } else {
      focusNextFilter('categoria'); // Focus descripcion
    }
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+3', (e) => {
    e.preventDefault();
    if (onNavigateToCodigoOem) {
      onNavigateToCodigoOem();
    } else {
      focusNextFilter('descripcion'); // Focus codigo_oem
    }
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+4', (e) => {
    e.preventDefault();
    if (onNavigateToCodigoUniv) {
      onNavigateToCodigoUniv();
    } else {
      focusNextFilter('codigo_oem'); // Focus codigo_upc
    }
  }, { enableOnFormTags: true });

  // Enter key navigation - move to next filter
  useHotkeys('enter', (e) => {
    const activeElement = document.activeElement as HTMLElement;
    if (!containerRef.current?.contains(activeElement)) return;

    // Only prevent default for filter inputs, not for select dropdowns
    const isFilterInput = activeElement.tagName === 'INPUT' &&
      activeElement.closest('[data-filter]');

    if (isFilterInput) {
      e.preventDefault();
      const currentFilter = activeElement.closest('[data-filter]')?.getAttribute('data-filter') || undefined;
      focusNextFilter(currentFilter);
    }
  }, {
    enableOnFormTags: true,
    enabled: true
  });

  return {
    containerRef,
    focusNextFilter
  };
};