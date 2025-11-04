/**
 * Hook para manejar ventanas secundarias de Tauri de forma simple
 *
 * Este hook facilita la creación, comunicación y gestión del ciclo de vida
 * de ventanas secundarias desde cualquier componente.
 *
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   const productWindow = useSecondaryWindow({
 *     windowId: 'product-selector-purchase',
 *     route: '/product-selector-window',
 *     title: 'Seleccionar Productos',
 *     onEvent: (eventName, data) => {
 *       if (eventName === 'product-selected') {
 *         handleProductSelect(data);
 *       }
 *     },
 *   });
 *
 *   return (
 *     <button onClick={() => productWindow.open()}>
 *       Abrir Selector
 *     </button>
 *   );
 * };
 * ```
 */

import {
  closeSecondaryWindow,
  createSecondaryWindow,
  focusSecondaryWindow,
  isWindowOpen,
  listenToWindowEvent,
  type SecondaryWindowConfig,
} from '@/utils/tauriWindows';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Configuración del hook useSecondaryWindow
 */
export interface UseSecondaryWindowConfig
  extends Omit<SecondaryWindowConfig, 'windowId'> {
  /** ID único de la ventana */
  windowId: string;
  /**
   * Callback que se ejecuta cuando la ventana emite un evento
   * @param eventName - Nombre del evento emitido
   * @param data - Datos enviados con el evento
   */
  onEvent?: (eventName: string, data: any) => void;
  /**
   * Callback que se ejecuta cuando la ventana se crea exitosamente
   */
  onWindowCreated?: (window: WebviewWindow) => void;
  /**
   * Callback que se ejecuta cuando la ventana se cierra
   */
  onWindowClosed?: () => void;
  /**
   * Si debe cerrar la ventana automáticamente cuando el componente se desmonte
   * @default true
   */
  autoCloseOnUnmount?: boolean;
  /**
   * Lista de eventos específicos a escuchar
   * Si no se especifica, escucha todos los eventos con el windowId como prefijo
   */
  listenToEvents?: string[];
}

/**
 * Resultado del hook useSecondaryWindow
 */
export interface UseSecondaryWindowResult {
  /** Si la ventana está actualmente abierta */
  isOpen: boolean;
  /** Si la ventana se está creando */
  isLoading: boolean;
  /** Error si ocurrió algún problema */
  error: Error | null;
  /** Instancia de la ventana (si está abierta) */
  window: WebviewWindow | null;
  /** Función para abrir la ventana */
  open: () => Promise<void>;
  /** Función para cerrar la ventana */
  close: () => Promise<void>;
  /** Función para enfocar la ventana */
  focus: () => Promise<void>;
  /** Función para alternar entre abrir/cerrar */
  toggle: () => Promise<void>;
}

/**
 * Hook para manejar ventanas secundarias de Tauri
 *
 * @param config - Configuración de la ventana
 * @returns Objeto con estado y métodos para controlar la ventana
 */
export function useSecondaryWindow(
  config: UseSecondaryWindowConfig
): UseSecondaryWindowResult {
  const {
    windowId,
    onEvent,
    onWindowCreated,
    onWindowClosed,
    autoCloseOnUnmount = true,
    listenToEvents,
    ...windowConfig
  } = config;

  // Si no se especifican eventos, usar solo 'window-closed' por defecto
  const eventsToListen = listenToEvents || ['window-closed'];

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [window, setWindow] = useState<WebviewWindow | null>(null);

  // Refs para mantener referencias actualizadas de callbacks
  const onEventRef = useRef(onEvent);
  const onWindowCreatedRef = useRef(onWindowCreated);
  const onWindowClosedRef = useRef(onWindowClosed);

  useEffect(() => {
    onEventRef.current = onEvent;
    onWindowCreatedRef.current = onWindowCreated;
    onWindowClosedRef.current = onWindowClosed;
  }, [onEvent, onWindowCreated, onWindowClosed]);

  // Limpiar ventanas huérfanas al montar
  useEffect(() => {
    const checkAndCleanup = async () => {
      const existingWindow = await isWindowOpen(windowId);
      if (existingWindow && !isOpen) {
        console.log(`[useSecondaryWindow] Limpiando ventana huérfana "${windowId}"`);
        try {
          await closeSecondaryWindow(windowId);
        } catch (err) {
          console.error(`[useSecondaryWindow] Error limpiando ventana huérfana:`, err);
        }
      }
    };

    checkAndCleanup();
  }, []); // Solo al montar

  /**
   * Abre la ventana secundaria
   */
  const open = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Crear/obtener ventana (createSecondaryWindow maneja la lógica de reutilización)
      const newWindow = await createSecondaryWindow({
        windowId,
        ...windowConfig,
      });

      setWindow(newWindow);
      setIsOpen(true);
      setIsLoading(false);

      // Callback de creación
      onWindowCreatedRef.current?.(newWindow);

      // Escuchar cuando la ventana se cierre
      await newWindow.onCloseRequested(() => {
        setIsOpen(false);
        setWindow(null);
        onWindowClosedRef.current?.();
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[useSecondaryWindow] Error abriendo ventana "${windowId}":`,
        error
      );
      setError(error);
      setIsLoading(false);
      setIsOpen(false);
      setWindow(null);
    }
  }, [windowId, windowConfig]);

  /**
   * Cierra la ventana secundaria
   */
  const close = useCallback(async () => {
    try {
      const success = await closeSecondaryWindow(windowId);
      if (success) {
        setIsOpen(false);
        setWindow(null);
        onWindowClosedRef.current?.();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[useSecondaryWindow] Error cerrando ventana "${windowId}":`,
        error
      );
      setError(error);
    }
  }, [windowId]);

  /**
   * Enfoca la ventana si está abierta
   */
  const focus = useCallback(async () => {
    if (isOpen) {
      await focusSecondaryWindow(windowId);
    }
  }, [windowId, isOpen]);

  /**
   * Alterna entre abrir/cerrar
   */
  const toggle = useCallback(async () => {
    if (isOpen) {
      await close();
    } else {
      await open();
    }
  }, [isOpen, open, close]);

  /**
   * Configurar listeners de eventos
   */
  useEffect(() => {
    if (!onEventRef.current) return;

    const unlisteners: Array<() => void> = [];

    // Escuchar eventos específicos
    const setupListeners = async () => {
      for (const eventName of eventsToListen) {
        try {
          const unlisten = await listenToWindowEvent(
            windowId,
            eventName,
            data => {
              onEventRef.current?.(eventName, data);
            }
          );
          unlisteners.push(unlisten);
        } catch (err) {
          console.error(
            `[useSecondaryWindow] Error escuchando evento "${eventName}":`,
            err
          );
        }
      }
    };

    setupListeners();

    // Cleanup: remover listeners
    return () => {
      unlisteners.forEach(unlisten => unlisten());
    };
  }, [windowId, eventsToListen]);

  //Cerrar ventana al desmontar componente
  useEffect(() => {
    return () => {
      if (autoCloseOnUnmount) {
        // Cerrar ventana de forma asíncrona en cleanup
        isWindowOpen(windowId).then(isOpen => {
          if (isOpen) {
            closeSecondaryWindow(windowId);
          }
        });
      }
    };
  }, [windowId, autoCloseOnUnmount]);

  return {
    isOpen,
    isLoading,
    error,
    window,
    open,
    close,
    focus,
    toggle,
  };
}

export interface UseProductSelectorWindowConfig {
  context: string;
  instanceId?: string;
  onProductSelect?: (product: any) => void;
  onMultiSelect?: (products: any[]) => void;
  onlyWithStock?: boolean;
  initialFilters?: Record<string, any>;
}

// ====== Hook específico para ventana de selector de productos ======
export function useProductSelectorWindow(
  config: UseProductSelectorWindowConfig
): UseSecondaryWindowResult {
  const {
    context,
    instanceId,
    onProductSelect,
    onMultiSelect,
    onlyWithStock,
    initialFilters,
  } = config;

  // Generar windowId único
  const windowId = instanceId
    ? `product-selector-${context}-${instanceId}`
    : `product-selector-${context}`;

  return useSecondaryWindow({
    windowId,
    route: '/window.html', // HTML genérico
    title: 'Seleccionar Productos',
    width: 1400,
    height: 750,
    queryParams: {
      component: 'product-selector', // ID del componente a renderizar
      context,
      onlyWithStock: String(onlyWithStock ?? false),
      ...(initialFilters ? { filters: JSON.stringify(initialFilters) } : {}),
    },
    listenToEvents: [
      'product-selected',
      'product-multi-selected',
      'window-closed',
    ],
    onEvent: (eventName, data) => {
      if (eventName === 'product-selected' && onProductSelect) {
        onProductSelect(data);
      } else if (eventName === 'product-multi-selected' && onMultiSelect) {
        onMultiSelect(data);
      }
    },
  });
}


// ========= Hook específico para ventana de selector de compras =========
export interface UsePurchaseSelectorWindowConfig {
  context: string;
  instanceId?: string;
  onPurchaseSelect?: (purchase: any) => void;
  onlyWithStock?: boolean;
}

export function usePurchaseSelectorWindow(
  config: UsePurchaseSelectorWindowConfig
): UseSecondaryWindowResult {
  const {
    context,
    instanceId,
    onPurchaseSelect,
    onlyWithStock,
  } = config;

  // Generar windowId único // NO se olvideen de cambiar en sus ventanasss
  const windowId = instanceId
    ? `purchase-selector-${context}-${instanceId}`
    : `purchase-selector-${context}`;

  // Usar hook genérico para crear ventana de selector de compras
  return useSecondaryWindow({
    windowId,
    route: '/window.html',
    title: 'Seleccionar Compra',
    // autoCloseOnUnmount: true, // Siempre cerrar al desmontar
    width: 1400,
    height: 900,
    queryParams: {
      component: 'purchase-selector',
      context,
      onlyWithStock: String(onlyWithStock ?? false),
      windowId,
    },
    listenToEvents: ['purchase-selected', 'window-closed'],
    onEvent: (eventName, data) => {
      if (eventName === 'purchase-selected' && onPurchaseSelect) {
        onPurchaseSelect(data);
      }
    },
  });
};


// Hook para views window
export interface UseViewConfigRoutesWindowConfig {
  context: string;
  instanceId?: string;
}
export function useViewConfigRoutesWindowConfig(
  config: UseViewConfigRoutesWindowConfig
): UseSecondaryWindowResult {
  const {
    context,
    instanceId,
  } = config;

  // Generar windowId único
  // El prefijo 'view-config' es más descriptivo que 'settings-routes'
  const windowId = instanceId
    ? `view-config-${context}-${instanceId}`
    : `view-config-${context}`;

  return useSecondaryWindow({
    windowId,
    route: '/window.html', // HTML genérico
    title: 'Configuración de Vistas',
    width: 1200,
    height: 800,
    queryParams: {
      component: 'settings-routes', // ID del componente a renderizar
      context,
    },
    listenToEvents: [
      'view-selected',
      'window-closed',
    ],
    onEvent: (eventName, data) => {
      // Aquí puede manejar eventos específicos si es necesario
    },
  });
}