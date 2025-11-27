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

import type { UIReturnDetailCreate } from '@/modules/returns/types/returnCreate.types';
import type { SelectedItem } from '@/types/windowSelectedItems';
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

  // Debug: detectar cambios en eventsToListen
  const eventsToListenRef = useRef(eventsToListen);
  if (eventsToListenRef.current !== eventsToListen) {
    // console.log(`[useSecondaryWindow] ${windowId}: ⚠️ eventsToListen cambió!`, {
    //   anterior: eventsToListenRef.current,
    //   nuevo: eventsToListen,
    // });
    eventsToListenRef.current = eventsToListen;
  }

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
        // console.log(`[useSecondaryWindow] Limpiando ventana huérfana "${windowId}"`);
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
    if (!onEventRef.current) {
      // console.log(`[useSecondaryWindow] ${windowId}: No hay onEvent, saltando setup de listeners`);
      return;
    }

    // console.log(`[useSecondaryWindow] ${windowId}: 🔧 Configurando listeners para eventos:`, eventsToListen);
    let unlisteners: Array<() => void> = [];
    let mounted = true;

    // Escuchar eventos específicos
    const setupListeners = async () => {
      for (const eventName of eventsToListen) {
        if (!mounted) {
          // console.log(`[useSecondaryWindow] ${windowId}: ⚠️ Componente desmontado, abortando setup`);
          break;
        }

        try {
          // console.log(`[useSecondaryWindow] ${windowId}: 📡 Registrando listener para "${eventName}"`);
          const unlisten = await listenToWindowEvent(
            windowId,
            eventName,
            data => {
              // console.log(`[useSecondaryWindow] ${windowId}: 🔔 Listener disparado para "${eventName}"`);
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
      // console.log(`[useSecondaryWindow] ${windowId}: ✅ ${unlisteners.length} listeners registrados exitosamente`);
    };

    setupListeners();

    // Cleanup: remover listeners
    return () => {
      mounted = false;
      // console.log(`[useSecondaryWindow] ${windowId}: 🧹 Limpiando ${unlisteners.length} listeners`);
      unlisteners.forEach(unlisten => {
        try {
          unlisten();
        } catch (err) {
          // console.error(`[useSecondaryWindow] Error limpiando listener:`, err);
        }
      });
      unlisteners = [];
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
  multiSelect?: boolean;
  mode?: 'create' | 'edit';
  validateStock?: boolean; // Si debe validar stock (false para cotizaciones/compras...)
  selectedItems?: SelectedItem[];
}

// Array constante para evitar recreaciones
const PRODUCT_SELECTOR_EVENTS = [
  'product-selected',
  'product-multi-selected',
  'window-closed',
] as const;

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
    multiSelect = false,
    mode = 'create',
    validateStock = false, // Por defecto no valida stock
    selectedItems = [],
  } = config;

  // Generar windowId único
  const windowId = instanceId
    ? `product-selector-${context}-${instanceId}`
    : `product-selector-${context}`;

  // Refs para mantener callbacks actualizados sin causar re-renders
  const onProductSelectRef = useRef(onProductSelect);
  const onMultiSelectRef = useRef(onMultiSelect);
  useEffect(() => {
    onProductSelectRef.current = onProductSelect;
    onMultiSelectRef.current = onMultiSelect;
  }, [onProductSelect, onMultiSelect]);
  // Callback estable que usa las refs
  // ✅ Sin dependencias, siempre estable
  const handleEvent = useCallback((eventName: string, data: any) => {
    if (eventName === 'product-selected' && onProductSelectRef.current) {
      onProductSelectRef.current(data);
    } else if (eventName === 'product-multi-selected' && onMultiSelectRef.current) {
      onMultiSelectRef.current(data);
    }
  }, []);

  return useSecondaryWindow({
    windowId,
    route: '/window.html', // HTML genérico
    title: 'Seleccionar Productos',
    width: 1400,
    height: 750,
    queryParams: {
      component: 'product-selector', // ID del componente a renderizar
      context,
      mode,
      validateStock: String(validateStock),
      onlyWithStock: String(onlyWithStock ?? false),
      selectedItems: JSON.stringify(selectedItems),
      ...(initialFilters ? { filters: JSON.stringify(initialFilters) } : {}),
      multiSelect: String(multiSelect),
    },
    listenToEvents: PRODUCT_SELECTOR_EVENTS as unknown as string[], // ✅ Referencia constante
    onEvent: handleEvent, // ✅ Referencia estable
  });
}


// ========= Hook específico para ventana de selector de compras =========
export interface UsePurchaseSelectorWindowConfig {
  context: string;
  instanceId?: string;
  onPurchaseSelect?: (purchase: any) => void;
  onlyWithStock?: boolean;
}

// Array constante para evitar recreaciones
const PURCHASE_SELECTOR_EVENTS = [
  'purchase-selected',
  'window-closed',
] as const;

export function usePurchaseSelectorWindow(
  config: UsePurchaseSelectorWindowConfig
): UseSecondaryWindowResult {
  const {
    context,
    instanceId,
    onPurchaseSelect,
    onlyWithStock,
  } = config;

  // Generar windowId único
  const windowId = instanceId
    ? `purchase-selector-${context}-${instanceId}`
    : `purchase-selector-${context}`;


  // Ref para mantener callback actualizado sin causar re-renders
  const onPurchaseSelectRef = useRef(onPurchaseSelect);
  useEffect(() => {
    onPurchaseSelectRef.current = onPurchaseSelect;
  }, [onPurchaseSelect]);
  // Callback estable que usa la ref
  // ✅ Sin dependencias, siempre estable
  const handleEvent = useCallback((eventName: string, data: any) => {
    if (eventName === 'purchase-selected' && onPurchaseSelectRef.current) {
      onPurchaseSelectRef.current(data);
    }
  }, []);


  // Usar hook genérico para crear ventana de selector de compras
  return useSecondaryWindow({
    windowId,
    route: '/window.html',
    title: 'Seleccionar Compra',
    width: 1400,
    height: 900,
    queryParams: {
      component: 'purchase-selector',
      context,
      onlyWithStock: String(onlyWithStock ?? false),
      windowId,
    },
    listenToEvents: PURCHASE_SELECTOR_EVENTS as unknown as string[], // ✅ Referencia constante
    onEvent: handleEvent, // ✅ Referencia estable
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

// ========= Hook específico para ventana de debug logs =========
const DEBUG_LOG_EVENTS = ['window-closed'] as const;

export function useDebugLogWindow(): UseSecondaryWindowResult {
  const windowId = 'debug-log-window';

  return useSecondaryWindow({
    windowId,
    route: '/window.html',
    title: 'Panel de Debug - TPS Intermotors',
    width: 800,
    height: 600,
    queryParams: {
      component: 'debug-log',
    },
    listenToEvents: DEBUG_LOG_EVENTS as unknown as string[],
    autoCloseOnUnmount: false, // Permitir que persista
  });
}

export interface UseSaleDetailSelectorWindowConfig {
  context: string;
  instanceId?: string;
  onMultiSelect?: (items: UIReturnDetailCreate[]) => void;
  initialFilters?: Record<string, any>;
  mode?: 'create' | 'edit';
  selectedItems?: UIReturnDetailCreate[];
}

// Array constante para evitar recreaciones
const SALE_DETAIL_SELECTOR_EVENTS = [
  'sale-details-multi-selected',
  'window-closed',
] as const;

/**
 * Hook para abrir ventana de selección de detalles de venta
 * Permite seleccionar múltiples productos de diferentes ventas
 */
export function useSaleDetailSelectorWindow(
  config: UseSaleDetailSelectorWindowConfig
): UseSecondaryWindowResult {
  const {
    context,
    instanceId,
    onMultiSelect,
    initialFilters,
    mode = 'create',
    selectedItems = [],
  } = config;

  // Generar windowId único
  const windowId = instanceId
    ? `sale-detail-selector-${context}-${instanceId}`
    : `sale-detail-selector-${context}`;

  // Ref para mantener callback actualizado sin causar re-renders
  const onMultiSelectRef = useRef(onMultiSelect);
  
  useEffect(() => {
    onMultiSelectRef.current = onMultiSelect;
  }, [onMultiSelect]);

  // Callback estable que usa la ref
  const handleEvent = useCallback((eventName: string, data: any) => {
    if (eventName === 'sale-details-multi-selected' && onMultiSelectRef.current) {
      onMultiSelectRef.current(data);
    }
  }, []);

  return useSecondaryWindow({
    windowId,
    route: '/window.html', // HTML genérico
    title: 'Seleccionar Items de Venta',
    width: 1400,
    height: 750,
    queryParams: {
      component: 'sale-detail-selector', // ID del componente a renderizar
      context,
      mode,
      selectedItems: JSON.stringify(selectedItems),
      ...(initialFilters ? { filters: JSON.stringify(initialFilters) } : {}),
    },
    listenToEvents: SALE_DETAIL_SELECTOR_EVENTS as unknown as string[],
    onEvent: handleEvent,
  });
}