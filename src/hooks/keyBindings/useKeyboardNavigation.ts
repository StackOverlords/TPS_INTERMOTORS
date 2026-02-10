import { useEffect, useRef, useState, useCallback } from "react";
import { useTabActive } from "../tabs/useTabActive";
import { useTabHotkeys } from "../tabs/useTabHotkeys";

interface UseKeyboardNavigationProps<T, E extends HTMLElement = HTMLElement> {
  items: T[];
  onPrimaryAction?: (item: T) => void;
  onSecondaryAction?: (item: T) => void;
  onDeleteAction?: (item: T) => void;
  getItemId?: (item: T) => string | number;
  enableHotkeys?: boolean;
  containerRef?: React.RefObject<E | null>;
  isDragging?: boolean;
  screenPath?: string;
  rowCount?: number;
  hotkeys?: {
    activate?: string;
    deactivate?: string;
    moveUp?: string;
    moveDown?: string;
    navigate?: string;
    primaryAction?: string;
    secondaryAction?: string;
    deleteAction?: string;
  };
}

/**
 * 🔧 Función helper para encontrar el contenedor scrolleable más cercano
 * Solo sube hasta encontrar el primer padre con overflow, evitando afectar layouts superiores
 */
function findScrollableParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;

  while (parent) {
    const { overflow, overflowY } = window.getComputedStyle(parent);

    // Encontrar el primer padre con scroll activo
    if (
      (overflow === "auto" ||
        overflow === "scroll" ||
        overflowY === "auto" ||
        overflowY === "scroll") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }

    // ⚠️ Detener búsqueda en ciertos contenedores para evitar subir demasiado
    if (
      parent.id === "main-scroll-container" ||
      parent.classList.contains("min-h-screen") ||
      (parent.hasAttribute("role") &&
        parent.getAttribute("role") === "tabpanel")
    ) {
      // Si este contenedor tiene scroll, usarlo; sino, detenerse
      if (parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      return null;
    }

    parent = parent.parentElement;
  }

  return null;
}

/**
 * 📜 Función para hacer scroll suave y controlado solo en el contenedor correcto
 */
function scrollRowIntoView(
  row: HTMLElement,
  options: {
    behavior?: ScrollBehavior;
    padding?: number;
  } = {},
): void {
  const { behavior = "smooth", padding = 100 } = options;

  // Buscar el contenedor scrolleable más cercano
  const scrollContainer = findScrollableParent(row);

  if (!scrollContainer) return;

  // Calcular posiciones relativas
  const containerRect = scrollContainer.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();

  // 🔍 Verificar si el elemento está COMPLETAMENTE visible (incluyendo padding)
  // El elemento debe estar al menos a 'padding' píxeles del borde para considerarse visible
  const isAboveView = rowRect.top < containerRect.top + padding;
  const isBelowView = rowRect.bottom > containerRect.bottom - padding;

  // Solo hacer scroll si la fila no está completamente visible
  if (isAboveView) {
    // ⬆️ Scroll hacia arriba - asegurar que la fila quede completamente visible con padding
    const scrollAmount = containerRect.top - rowRect.top + padding;
    scrollContainer.scrollBy({
      top: -scrollAmount,
      behavior,
    });
  } else if (isBelowView) {
    // ⬇️ Scroll hacia abajo - asegurar que la fila quede completamente visible con padding
    const scrollAmount = rowRect.bottom - containerRect.bottom + padding;
    scrollContainer.scrollBy({
      top: scrollAmount,
      behavior,
    });
  }
}

export const useKeyboardNavigation = <T, E extends HTMLElement = HTMLElement>({
  items,
  onPrimaryAction,
  onSecondaryAction,
  onDeleteAction,
  getItemId,
  enableHotkeys = true,
  containerRef: externalRef,
  isDragging = false,
  screenPath,
  rowCount,
  hotkeys = {
    activate: "alt+t",
    deactivate: "escape",
    moveUp: "up",
    moveDown: "down",
    navigate: "tab",
    primaryAction: "enter",
    secondaryAction: "alt+enter",
    deleteAction: "alt+delete",
  },
}: UseKeyboardNavigationProps<T, E>) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isNavigatingWithinRow, setIsNavigatingWithinRow] = useState(false);
  const [currentElementIndex, setCurrentElementIndex] = useState(-1);

  const internalRef = useRef<E>(null);
  const containerRef = externalRef || internalRef;
  const selectedItem = items[selectedIndex];

  const effectiveRowCount = rowCount ?? items.length;

  const isTabActive = useTabActive(screenPath);
  const isHotkeysEnabled = enableHotkeys && !isDragging && isTabActive;

  // 🆕 Refs para gestionar el comportamiento del scroll inicial
  const hasEverBeenFocused = useRef(false); // Track si alguna vez se activó la tabla
  const shouldScrollOnNextFocus = useRef(false); // Flag para forzar scroll en re-activación

  useEffect(() => {
    if (!isFocused || isDragging || !isTabActive) return;

    const container = containerRef.current;
    if (!container) return;

    const selectedRow = container.querySelector(
      `[data-row-index="${selectedIndex}"]`,
    ) as HTMLElement | null;

    if (!selectedRow) return;

    const isFirstTimeEver = !hasEverBeenFocused.current;
    const isReactivation = shouldScrollOnNextFocus.current;

    if (isFirstTimeEver) {
      // ⚠️ Primera activación global: NO hacer scroll
      hasEverBeenFocused.current = true;
      shouldScrollOnNextFocus.current = false;
      return;
    }

    if (isReactivation) {
      // ✅ Re-activación: Hacer scroll al item previamente seleccionado
      scrollRowIntoView(selectedRow, {
        behavior: "smooth",
        padding: 100, // Padding generoso para re-activación
      });
      shouldScrollOnNextFocus.current = false;
      return;
    }

    // ✅ Navegación normal (flechas): Hacer scroll con padding adecuado
    scrollRowIntoView(selectedRow, {
      behavior: "smooth",
      padding: 100, // Padding para garantizar que se vea completo
    });
  }, [selectedIndex, isFocused, containerRef, isDragging, isTabActive]);

  // 🔄 Cuando se DESACTIVA el foco, marcar que en la próxima activación SÍ debe hacer scroll
  useEffect(() => {
    if (!isFocused && hasEverBeenFocused.current) {
      // Si ya se había activado antes y ahora se desactivó,
      // la próxima activación debe hacer scroll al item seleccionado
      shouldScrollOnNextFocus.current = true;
    }
  }, [isFocused]);

  // Resetear índice cuando cambien los items
  useEffect(() => {
    if (effectiveRowCount > 0 && selectedIndex >= effectiveRowCount) {
      setSelectedIndex(Math.max(0, effectiveRowCount - 1));
    }
  }, [effectiveRowCount, selectedIndex]);

  // Resetear navegación interna cuando se arrastra
  useEffect(() => {
    if (isDragging && isNavigatingWithinRow) {
      setIsNavigatingWithinRow(false);
      setCurrentElementIndex(-1);
    }
  }, [isDragging, isNavigatingWithinRow]);

  // Desactivar foco cuando el tab no está activo
  useEffect(() => {
    if (!isTabActive && isFocused) {
      setIsFocused(false);
      setIsNavigatingWithinRow(false);
      setCurrentElementIndex(-1);
    }
  }, [isTabActive, isFocused]);

  const getFocusableElementsInSelectedRow = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const selectedRow = containerRef.current.querySelector(
      `[data-row-index="${selectedIndex}"]`,
    );
    if (!selectedRow) return [];

    const focusableElements = selectedRow.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]):not([disabled])',
    );

    return Array.from(focusableElements) as HTMLElement[];
  }, [selectedIndex, containerRef]);

  const isInRestrictedContext = useCallback((): boolean => {
    const activeElement = document.activeElement as HTMLElement;

    if (!activeElement) return false;

    if (isDragging) return true;

    return (
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.contentEditable === "true" ||
      activeElement.closest('[role="menu"]') !== null ||
      activeElement.closest('[role="dialog"]') !== null ||
      activeElement.closest("[data-radix-popper-content-wrapper]") !== null ||
      activeElement.closest(".dropdown-content") !== null ||
      activeElement.hasAttribute("data-dragging")
    );
  }, [isDragging]);

  // 🔥 Activar navegación por teclado
  useTabHotkeys(
    hotkeys.activate!,
    (e) => {
      e.preventDefault();
      setIsFocused(true);
      setIsNavigatingWithinRow(false);
      setCurrentElementIndex(-1);

      containerRef.current?.focus({ preventScroll: true });
    },
    {
      enabled: isHotkeysEnabled,
      enableOnFormTags: true,
      preventDefault: true,
    },
  );

  // Desactivar navegación por teclado
  useTabHotkeys(
    hotkeys.deactivate!,
    () => {
      setIsFocused(false);
      setIsNavigatingWithinRow(false);
      setCurrentElementIndex(-1);
    },
    { enabled: isFocused && isHotkeysEnabled },
  );

  // ⬆️ Navegación hacia arriba
  useTabHotkeys(
    hotkeys.moveUp!,
    (e) => {
      e.preventDefault();

      if (!isInRestrictedContext()) {
        setSelectedIndex((prev) => {
          const newIndex = prev - 1;
          if (newIndex >= 0 && newIndex !== prev) {
            return newIndex;
          }
          return prev;
        });
        setIsNavigatingWithinRow(false);
        setCurrentElementIndex(-1);
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enabled: isFocused && isHotkeysEnabled,
    },
  );

  // ⬇️ Navegación hacia abajo
  useTabHotkeys(
    hotkeys.moveDown!,
    (e) => {
      e.preventDefault();

      if (!isInRestrictedContext()) {
        setSelectedIndex((prev) => {
          const maxIndex = effectiveRowCount - 1;
          const newIndex = prev + 1;
          if (newIndex <= maxIndex && newIndex !== prev) {
            return newIndex;
          }
          return prev;
        });
        setIsNavigatingWithinRow(false);
        setCurrentElementIndex(-1);
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enabled: isFocused && isHotkeysEnabled,
    },
  );

  // ↹ TAB - Navegar elementos dentro de la fila seleccionada
  useTabHotkeys(
    hotkeys.navigate!,
    (e) => {
      if (!isInRestrictedContext()) {
        e.preventDefault();

        const focusableElements = getFocusableElementsInSelectedRow();

        if (focusableElements.length === 0) return;

        if (!isNavigatingWithinRow) {
          setIsNavigatingWithinRow(true);
          setCurrentElementIndex(0);
          focusableElements[0].focus();
        } else {
          if (e.shiftKey) {
            const newIndex = currentElementIndex - 1;
            if (newIndex >= 0) {
              setCurrentElementIndex(newIndex);
              focusableElements[newIndex].focus();
            } else {
              setIsNavigatingWithinRow(false);
              setCurrentElementIndex(-1);
              containerRef.current?.focus();
            }
          } else {
            const newIndex = currentElementIndex + 1;
            if (newIndex < focusableElements.length) {
              setCurrentElementIndex(newIndex);
              focusableElements[newIndex].focus();
            } else {
              setIsNavigatingWithinRow(false);
              setCurrentElementIndex(-1);
              containerRef.current?.focus();
            }
          }
        }
      }
    },
    {
      enableOnFormTags: true,
      preventDefault: false,
      enabled: isFocused && isHotkeysEnabled,
    },
  );

  // ⏎ Acción primaria
  useTabHotkeys(
    hotkeys.primaryAction!,
    (e) => {
      if (
        !isInRestrictedContext() &&
        !isNavigatingWithinRow &&
        selectedItem &&
        onPrimaryAction
      ) {
        e.preventDefault();
        onPrimaryAction(selectedItem);
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enabled: isFocused && isHotkeysEnabled,
    },
  );

  // ⎇ ⏎ Acción secundaria
  useTabHotkeys(
    hotkeys.secondaryAction!,
    (e) => {
      if (!isInRestrictedContext() && selectedItem && onSecondaryAction) {
        e.preventDefault();
        onSecondaryAction(selectedItem);
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enabled: isFocused && isHotkeysEnabled,
    },
  );

  // ⌦ Acción de eliminar
  useTabHotkeys(
    hotkeys.deleteAction!,
    (e) => {
      if (!isInRestrictedContext() && selectedItem && onDeleteAction) {
        e.preventDefault();
        onDeleteAction(selectedItem);
      }
    },
    {
      enableOnFormTags: false,
      preventDefault: true,
      enabled: isFocused && isHotkeysEnabled,
    },
  );

  // Resetear navegación dentro de fila cuando cambia la fila seleccionada
  useEffect(() => {
    setIsNavigatingWithinRow(false);
    setCurrentElementIndex(-1);
  }, [selectedIndex]);

  // 🖱️ Manejar clics para activar/desactivar foco
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (isDragging || !isTabActive) return;

      const target = e.target as HTMLElement;

      if (containerRef.current && containerRef.current.contains(target)) {
        const isInteractiveElement = target.closest(
          'button, input, textarea, select, a[href], [role="button"], [role="menuitem"]',
        ) as HTMLElement;

        if (!isFocused) {
          setIsFocused(true);
        }

        let clickedRow = target.closest("[data-row-index]") as HTMLElement;

        if (!clickedRow && containerRef.current) {
          const allRows =
            containerRef.current.querySelectorAll("[data-row-index]");
          for (const row of Array.from(allRows)) {
            if (row.contains(target)) {
              clickedRow = row as HTMLElement;
              break;
            }
          }
        }

        if (clickedRow) {
          const rowIndex = parseInt(
            clickedRow.getAttribute("data-row-index") || "0",
          );
          setSelectedIndex(rowIndex);

          if (isInteractiveElement) {
            const focusableElements = getFocusableElementsInSelectedRow();
            const elementIndex =
              focusableElements.indexOf(isInteractiveElement);
            if (elementIndex !== -1) {
              setIsNavigatingWithinRow(true);
              setCurrentElementIndex(elementIndex);
            }
          } else {
            setIsNavigatingWithinRow(false);
            setCurrentElementIndex(-1);
          }
        }
      } else {
        setIsFocused(false);
        setIsNavigatingWithinRow(false);
        setCurrentElementIndex(-1);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [
    getFocusableElementsInSelectedRow,
    containerRef,
    isDragging,
    isTabActive,
    isFocused,
  ]);

  // 📍 Navegar a un índice específico
  const navigateToItem = useCallback(
    (index: number) => {
      if (index >= 0 && index < effectiveRowCount) {
        setSelectedIndex(index);
      }
    },
    [effectiveRowCount],
  );

  // 🔍 Navegar a un item por ID
  const navigateToItemById = useCallback(
    (id: string | number) => {
      if (!getItemId) return;

      const index = items.findIndex((item) => getItemId(item) === id);
      if (index !== -1) {
        setSelectedIndex(index);
      }
    },
    [items, getItemId],
  );

  return {
    selectedIndex,
    selectedItem,
    isFocused,
    isNavigatingWithinRow,
    currentElementIndex,
    isTabActive,
    containerRef,
    setSelectedIndex,
    setIsFocused,
    navigateToItem,
    navigateToItemById,
    getFocusableElementsInSelectedRow,
    hasItems: effectiveRowCount > 0,
    totalItems: effectiveRowCount,
    isFirstItem: selectedIndex === 0,
    isLastItem: selectedIndex === effectiveRowCount - 1,
    hotkeys,
  };
};
