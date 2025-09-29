import { useEffect, useRef, useState, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface UseKeyboardNavigationProps<T, E extends HTMLElement = HTMLElement> {
    items: T[];
    onPrimaryAction?: (item: T) => void;
    onSecondaryAction?: (item: T) => void;
    onDeleteAction?: (item: T) => void;
    getItemId?: (item: T) => string | number;
    enableHotkeys?: boolean;
    containerRef?: React.RefObject<E | null>; // 🆕 Ref externa opcional
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

export const useKeyboardNavigation = <T, E extends HTMLElement = HTMLElement>({
    items,
    onPrimaryAction,
    onSecondaryAction,
    onDeleteAction,
    getItemId,
    enableHotkeys = true,
    containerRef: externalRef, // 🆕 Ref externa renombrada
    hotkeys = {
        activate: 'alt+t',
        deactivate: 'escape',
        moveUp: 'up',
        moveDown: 'down',
        navigate: 'tab',
        primaryAction: 'enter',
        secondaryAction: 'alt+enter',
        deleteAction: 'alt+delete'
    }
}: UseKeyboardNavigationProps<T, E>) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const [isNavigatingWithinRow, setIsNavigatingWithinRow] = useState(false);
    const [currentElementIndex, setCurrentElementIndex] = useState(-1);
    // 🆕 Usar ref externa o crear una interna
    const internalRef = useRef<E>(null);
    const containerRef = externalRef || internalRef;
    const selectedItem = items[selectedIndex];

    // Auto-scroll al elemento seleccionado
    useEffect(() => {
        if (!isFocused) return;
        if (containerRef.current) {
            const selectedRow = containerRef.current.querySelector(
                `[data-row-index="${selectedIndex}"]`
            ) as HTMLElement | null;

            if (selectedRow) {
                selectedRow.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [selectedIndex, isFocused, containerRef]);

    // Resetear índice cuando cambien los items
    useEffect(() => {
        if (items.length > 0 && selectedIndex >= items.length) {
            setSelectedIndex(0);
        }
    }, [items.length, selectedIndex]);

    // Función para obtener elementos focuseables en la fila seleccionada
    const getFocusableElementsInSelectedRow = useCallback((): HTMLElement[] => {
        if (!containerRef.current) return [];

        const selectedRow = containerRef.current.querySelector(`[data-row-index="${selectedIndex}"]`);
        if (!selectedRow) return [];

        const focusableElements = selectedRow.querySelectorAll(
            'button, input, textarea, select, a, [tabindex]:not([tabindex="-1"])'
        );

        return Array.from(focusableElements) as HTMLElement[];
    }, [selectedIndex, containerRef]);

    // Función para verificar si debemos bloquear las hotkeys
    const isInRestrictedContext = (): boolean => {
        const activeElement = document.activeElement as HTMLElement;

        if (!activeElement) return false;

        return (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true' ||
            activeElement.closest('[role="menu"]') !== null ||
            activeElement.closest('[data-radix-popper-content-wrapper]') !== null ||
            activeElement.closest('.dropdown-content') !== null
        );
    };

    // Activar navegación por teclado
    useHotkeys(hotkeys.activate!, () => {
        if (!enableHotkeys) return;
        setIsFocused(true);
        setIsNavigatingWithinRow(false);
        setCurrentElementIndex(-1);
        containerRef.current?.focus();
    });

    // Desactivar navegación por teclado
    useHotkeys(hotkeys.deactivate!, () => {
        if (!enableHotkeys) return;
        setIsFocused(false);
        setIsNavigatingWithinRow(false);
        setCurrentElementIndex(-1);
    }, {
        enabled: isFocused && enableHotkeys
    });

    // Navegación hacia arriba
    useHotkeys(hotkeys.moveUp!, () => {
        if (!enableHotkeys || !isInRestrictedContext() && isFocused) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
            setIsNavigatingWithinRow(false);
            setCurrentElementIndex(-1);
        }
    }, {
        enableOnFormTags: false,
        preventDefault: true,
        enabled: isFocused && enableHotkeys
    });

    // Navegación hacia abajo
    useHotkeys(hotkeys.moveDown!, () => {
        if (!enableHotkeys || !isInRestrictedContext() && isFocused) {
            setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
            setIsNavigatingWithinRow(false);
            setCurrentElementIndex(-1);
        }
    }, {
        enableOnFormTags: false,
        preventDefault: true,
        enabled: isFocused && enableHotkeys
    });

    // TAB - Navegar elementos dentro de la fila seleccionada
    useHotkeys(hotkeys.navigate!, (e) => {
        if (!enableHotkeys || !isInRestrictedContext() && isFocused) {
            e.preventDefault();

            const focusableElements = getFocusableElementsInSelectedRow();

            if (focusableElements.length === 0) return;

            if (!isNavigatingWithinRow) {
                // Primera vez presionando Tab - enfocar primer elemento
                setIsNavigatingWithinRow(true);
                setCurrentElementIndex(0);
                focusableElements[0].focus();
            } else {
                // Ya estamos navegando dentro de la fila
                if (e.shiftKey) {
                    // Shift+Tab - ir hacia atrás
                    const newIndex = currentElementIndex - 1;
                    if (newIndex >= 0) {
                        setCurrentElementIndex(newIndex);
                        focusableElements[newIndex].focus();
                    } else {
                        // Salir del modo navegación dentro de fila
                        setIsNavigatingWithinRow(false);
                        setCurrentElementIndex(-1);
                        containerRef.current?.focus();
                    }
                } else {
                    // Tab - ir hacia adelante
                    const newIndex = currentElementIndex + 1;
                    if (newIndex < focusableElements.length) {
                        setCurrentElementIndex(newIndex);
                        focusableElements[newIndex].focus();
                    } else {
                        // Salir del modo navegación dentro de fila
                        setIsNavigatingWithinRow(false);
                        setCurrentElementIndex(-1);
                        containerRef.current?.focus();
                    }
                }
            }
        }
    }, {
        enableOnFormTags: true,
        preventDefault: false,
        enabled: isFocused && enableHotkeys
    });

    // Acción primaria
    useHotkeys(hotkeys.primaryAction!, () => {
        if (!enableHotkeys || !isInRestrictedContext() && isFocused && !isNavigatingWithinRow && selectedItem && onPrimaryAction) {
            onPrimaryAction?.(selectedItem);
        }
    }, {
        enableOnFormTags: false,
        preventDefault: true,
        enabled: isFocused && enableHotkeys
    });

    // Acción secundaria
    useHotkeys(hotkeys.secondaryAction!, () => {
        if (!enableHotkeys || !isInRestrictedContext() && isFocused && selectedItem && onSecondaryAction) {
            onSecondaryAction?.(selectedItem);
        }
    }, {
        enableOnFormTags: false,
        preventDefault: true,
        enabled: isFocused && enableHotkeys
    });

    // Acción de eliminar
    useHotkeys(hotkeys.deleteAction!, () => {
        if (!enableHotkeys || !isInRestrictedContext() && isFocused && onDeleteAction) {
            onDeleteAction?.(selectedItem);
        }
    }, {
        enableOnFormTags: false,
        preventDefault: true,
        enabled: isFocused && enableHotkeys
    });

    // Resetear navegación dentro de fila cuando cambia la fila seleccionada
    useEffect(() => {
        setIsNavigatingWithinRow(false);
        setCurrentElementIndex(-1);
    }, [selectedIndex]);

    // Manejar clics para activar/desactivar foco
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (containerRef.current && containerRef.current.contains(target)) {
                // Clic dentro del contenedor
                setIsFocused(true);

                // Si hicimos clic en un elemento dentro de una fila, actualizar selectedIndex
                const clickedRow = target.closest('[data-row-index]') as HTMLElement;
                if (clickedRow) {
                    const rowIndex = parseInt(clickedRow.getAttribute('data-row-index') || '0');
                    setSelectedIndex(rowIndex);
                }

                // Si hicimos clic en un elemento focuseable, entrar en modo navegación dentro de fila
                const focusableElement = target.closest('button, input, textarea, select, a') as HTMLElement;
                if (focusableElement && clickedRow) {
                    const focusableElements = getFocusableElementsInSelectedRow();
                    const elementIndex = focusableElements.indexOf(focusableElement);
                    if (elementIndex !== -1) {
                        setIsNavigatingWithinRow(true);
                        setCurrentElementIndex(elementIndex);
                    }
                }
            } else {
                // Clic fuera del contenedor
                setIsFocused(false);
                setIsNavigatingWithinRow(false);
                setCurrentElementIndex(-1);
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [getFocusableElementsInSelectedRow, containerRef]);

    // Funciones de utilidad

    const navigateToItem = (index: number) => {
        if (index >= 0 && index < items.length) {
            setSelectedIndex(index);
        }
    };

    const navigateToItemById = (id: string | number) => {
        if (!getItemId) return;

        const index = items.findIndex(item => getItemId(item) === id);
        if (index !== -1) {
            setSelectedIndex(index);
        }
    };

    return {
        // Estado
        selectedIndex,
        selectedItem,
        isFocused,
        isNavigatingWithinRow,
        currentElementIndex,

        // Refs
        containerRef,

        // Setters
        setSelectedIndex,
        setIsFocused,

        // Funciones de utilidad
        navigateToItem,
        navigateToItemById,
        getFocusableElementsInSelectedRow,

        // Información del estado actual
        hasItems: items.length > 0,
        totalItems: items.length,
        isFirstItem: selectedIndex === 0,
        isLastItem: selectedIndex === items.length - 1,

        // atajos de teclado
        hotkeys,
    };
};