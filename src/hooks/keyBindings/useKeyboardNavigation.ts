import { useEffect, useRef, useState, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTabActive } from '../tabs/useTabActive';

interface UseKeyboardNavigationProps<T, E extends HTMLElement = HTMLElement> {
    items: T[];
    onPrimaryAction?: (item: T) => void;
    onSecondaryAction?: (item: T) => void;
    onDeleteAction?: (item: T) => void;
    getItemId?: (item: T) => string | number;
    enableHotkeys?: boolean;
    containerRef?: React.RefObject<E | null>;
    isDragging?: boolean;
    screenPath?: string; // 🆕 Path del tab para verificar si está activo
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
    containerRef: externalRef,
    isDragging = false,
    screenPath, // 🆕
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

    const internalRef = useRef<E>(null);
    const containerRef = externalRef || internalRef;
    const selectedItem = items[selectedIndex];

    // 🆕 Verificar si el tab está activo
    const isTabActive = useTabActive(screenPath);

    // 🆕 Hotkeys solo habilitados si el tab está activo
    const isHotkeysEnabled = enableHotkeys && !isDragging && isTabActive;

    // Auto-scroll al elemento seleccionado
    useEffect(() => {
        if (!isFocused || isDragging || !isTabActive) return;
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
    }, [selectedIndex, isFocused, containerRef, isDragging, isTabActive]);

    // Resetear índice cuando cambien los items
    useEffect(() => {
        if (items.length > 0 && selectedIndex >= items.length) {
            setSelectedIndex(Math.max(0, items.length - 1));
        }
    }, [items.length, selectedIndex]);

    // 🆕 Desactivar navegación durante drag
    useEffect(() => {
        if (isDragging && isNavigatingWithinRow) {
            setIsNavigatingWithinRow(false);
            setCurrentElementIndex(-1);
        }
    }, [isDragging, isNavigatingWithinRow]);

    // 🆕 Desactivar foco cuando el tab se desactiva
    useEffect(() => {
        if (!isTabActive && isFocused) {
            setIsFocused(false);
            setIsNavigatingWithinRow(false);
            setCurrentElementIndex(-1);
        }
    }, [isTabActive, isFocused]);

    // Función para obtener elementos focuseables en la fila seleccionada
    const getFocusableElementsInSelectedRow = useCallback((): HTMLElement[] => {
        if (!containerRef.current) return [];

        const selectedRow = containerRef.current.querySelector(`[data-row-index="${selectedIndex}"]`);
        if (!selectedRow) return [];

        const focusableElements = selectedRow.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]):not([disabled])'
        );

        return Array.from(focusableElements) as HTMLElement[];
    }, [selectedIndex, containerRef]);

    // Función mejorada para verificar contexto restringido
    const isInRestrictedContext = useCallback((): boolean => {
        const activeElement = document.activeElement as HTMLElement;

        if (!activeElement) return false;

        // 🆕 Agregar verificación de drag
        if (isDragging) return true;

        return (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true' ||
            activeElement.closest('[role="menu"]') !== null ||
            activeElement.closest('[role="dialog"]') !== null ||
            activeElement.closest('[data-radix-popper-content-wrapper]') !== null ||
            activeElement.closest('.dropdown-content') !== null ||
            activeElement.hasAttribute('data-dragging')
        );
    }, [isDragging]);

    // ✅ Activar navegación por teclado - SIN restricciones de contexto
    useHotkeys(
        hotkeys.activate!,
        (e) => {
            e.preventDefault();
            setIsFocused(true);
            setIsNavigatingWithinRow(false);
            setCurrentElementIndex(-1);
            containerRef.current?.focus();
        },
        { 
            enabled: isHotkeysEnabled,
            enableOnFormTags: true,
            preventDefault: true
        }
    );

    // Desactivar navegación por teclado
    useHotkeys(
        hotkeys.deactivate!,
        () => {
            setIsFocused(false);
            setIsNavigatingWithinRow(false);
            setCurrentElementIndex(-1);
        },
        { enabled: isFocused && isHotkeysEnabled }
    );

    // Navegación hacia arriba
    useHotkeys(
        hotkeys.moveUp!,
        (e) => {
            if (!isInRestrictedContext()) {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(0, prev - 1));
                setIsNavigatingWithinRow(false);
                setCurrentElementIndex(-1);
            }
        },
        {
            enableOnFormTags: false,
            preventDefault: true,
            enabled: isFocused && isHotkeysEnabled
        }
    );

    // Navegación hacia abajo
    useHotkeys(
        hotkeys.moveDown!,
        (e) => {
            if (!isInRestrictedContext()) {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
                setIsNavigatingWithinRow(false);
                setCurrentElementIndex(-1);
            }
        },
        {
            enableOnFormTags: false,
            preventDefault: true,
            enabled: isFocused && isHotkeysEnabled
        }
    );

    // TAB - Navegar elementos dentro de la fila seleccionada
    useHotkeys(
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
            enabled: isFocused && isHotkeysEnabled
        }
    );

    // Acción primaria
    useHotkeys(
        hotkeys.primaryAction!,
        (e) => {
            if (!isInRestrictedContext() && !isNavigatingWithinRow && selectedItem && onPrimaryAction) {
                e.preventDefault();
                onPrimaryAction(selectedItem);
            }
        },
        {
            enableOnFormTags: false,
            preventDefault: true,
            enabled: isFocused && isHotkeysEnabled
        }
    );

    // Acción secundaria
    useHotkeys(
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
            enabled: isFocused && isHotkeysEnabled
        }
    );

    // Acción de eliminar
    useHotkeys(
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
            enabled: isFocused && isHotkeysEnabled
        }
    );

    // Resetear navegación dentro de fila cuando cambia la fila seleccionada
    useEffect(() => {
        setIsNavigatingWithinRow(false);
        setCurrentElementIndex(-1);
    }, [selectedIndex]);

    // ✅ Manejar clics para activar/desactivar foco
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // 🆕 Ignorar clicks durante drag o si el tab no está activo
            if (isDragging || !isTabActive) return;

            const target = e.target as HTMLElement;

            // ✅ Verificar si el click es DENTRO del contenedor
            if (containerRef.current && containerRef.current.contains(target)) {
                // ✅ Verificar si el click fue en un elemento interactivo
                const isInteractiveElement = target.closest(
                    'button, input, textarea, select, a[href], [role="button"], [role="menuitem"]'
                ) as HTMLElement;

                // ✅ ACTIVAR si no estaba activo
                if (!isFocused) {
                    setIsFocused(true);
                }

                // ✅ Buscar la fila más cercana desde el target hacia arriba
                let clickedRow = target.closest('[data-row-index]') as HTMLElement;
                
                // Si no encontramos la fila directamente, buscar en los padres del contenedor
                if (!clickedRow && containerRef.current) {
                    const allRows = containerRef.current.querySelectorAll('[data-row-index]');
                    for (const row of Array.from(allRows)) {
                        if (row.contains(target)) {
                            clickedRow = row as HTMLElement;
                            break;
                        }
                    }
                }

                if (clickedRow) {
                    const rowIndex = parseInt(clickedRow.getAttribute('data-row-index') || '0');
                    setSelectedIndex(rowIndex);

                    // ✅ Solo manejar navegación dentro de fila si es un elemento focuseable
                    if (isInteractiveElement) {
                        const focusableElements = getFocusableElementsInSelectedRow();
                        const elementIndex = focusableElements.indexOf(isInteractiveElement);
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
                // ✅ DESACTIVAR solo si el click es FUERA del contenedor
                setIsFocused(false);
                setIsNavigatingWithinRow(false);
                setCurrentElementIndex(-1);
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [getFocusableElementsInSelectedRow, containerRef, isDragging, isTabActive, isFocused]);

    // Funciones de utilidad
    const navigateToItem = useCallback((index: number) => {
        if (index >= 0 && index < items.length) {
            setSelectedIndex(index);
        }
    }, [items.length]);

    const navigateToItemById = useCallback((id: string | number) => {
        if (!getItemId) return;

        const index = items.findIndex(item => getItemId(item) === id);
        if (index !== -1) {
            setSelectedIndex(index);
        }
    }, [items, getItemId]);

    return {
        // Estado
        selectedIndex,
        selectedItem,
        isFocused,
        isNavigatingWithinRow,
        currentElementIndex,
        isTabActive, // 🆕 Exponer el estado del tab

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

        // Atajos de teclado
        hotkeys,
    };
};