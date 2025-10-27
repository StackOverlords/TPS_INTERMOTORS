/**
 * Utilidad genérica para manejar ventanas secundarias de Tauri
 *
 * Este sistema permite crear ventanas nativas del SO que pueden comunicarse
 * con la ventana principal mediante eventos.
 *
 * @example
 * ```typescript
 * // Crear ventana
 * const window = await createSecondaryWindow({
 *   windowId: 'product-selector-purchase-1',
 *   route: '/product-selector-window',
 *   title: 'Seleccionar Productos',
 *   width: 1200,
 *   height: 800,
 * });
 *
 * // Escuchar eventos
 * const unlisten = await listenToWindowEvent('product-selector-purchase-1', 'product-selected', (data) => {
 *   console.log('Producto seleccionado:', data);
 * });
 * ```
 */

import { emit, listen } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * Configuración para crear una ventana secundaria
 */
export interface SecondaryWindowConfig {
  // ID único de la ventana (debe ser único en toda la aplicación)
  windowId: string;
  route: string;
  title: string;
  // Ancho inicial en píxeles
  width?: number;
  // Alto inicial en píxeles
  height?: number;
  // Si la ventana puede redimensionarse
  resizable?: boolean;
  // Si la ventana debe centrarse en la pantalla
  center?: boolean;
  // Posición X inicial (si center es false)
  x?: number;
  // Posición Y inicial (si center es false)
  y?: number;
  // Si debe mostrarse en pantalla completa
  fullscreen?: boolean;
  // Si debe estar siempre al frente
  alwaysOnTop?: boolean;
  // Si debe tener decoraciones (botones de cerrar, minimizar, etc)
  decorations?: boolean;
  // Si debe ser transparente
  transparent?: boolean;
  // Query params adicionales para pasar a la ruta
  queryParams?: Record<string, string>;
}

export async function createSecondaryWindow(
  config: SecondaryWindowConfig
): Promise<WebviewWindow> {
  const {
    windowId,
    route,
    title,
    width = 1200,
    height = 800,
    resizable = true,
    center = true,
    x,
    y,
    fullscreen = false,
    alwaysOnTop = false,
    decorations = true,
    transparent = false,
    queryParams = {},
  } = config;

  // Verificar si ya existe una ventana con este ID
  const existingWindow = await WebviewWindow.getByLabel(windowId);
  if (existingWindow) {
    try {
      await existingWindow.setFocus();
    } catch (err) {
      console.warn(`[TauriWindows] No se pudo enfocar ventana "${windowId}":`, err);
    }
    return existingWindow;
  }

  // Construir URL con query params
  const queryString = new URLSearchParams({
    windowId,
    ...queryParams,
  }).toString();

  const url = `${route}?${queryString}`;

  // Crear nueva ventana
  const window = new WebviewWindow(windowId, {
    url,
    title,
    width,
    height,
    resizable,
    center,
    x: !center ? x : undefined,
    y: !center ? y : undefined,
    fullscreen,
    alwaysOnTop,
    decorations,
    transparent,
  });

  // Esperar a que la ventana esté lista
  await new Promise<void>((resolve, reject) => {
    window.once('tauri://created', () => {
      console.log(`[TauriWindows] Ventana "${windowId}" creada exitosamente`);
      resolve();
    });

    window.once('tauri://error', (error) => {
      console.error(`[TauriWindows] Error creando ventana "${windowId}":`, error);
      reject(new Error(`Error creando ventana: ${JSON.stringify(error)}`));
    });

    // Timeout de seguridad (10 segundos)
    setTimeout(() => {
      reject(new Error('Timeout creando ventana'));
    }, 10000);
  });

  return window;
}

export async function closeSecondaryWindow(windowId: string): Promise<boolean> {
  const window = await WebviewWindow.getByLabel(windowId);
  if (!window) {
    console.warn(`[TauriWindows] Ventana "${windowId}" no encontrada`);
    return false;
  }

  await window.close();
  console.log(`[TauriWindows] Ventana "${windowId}" cerrada`);
  return true;
}


export async function getSecondaryWindow(windowId: string): Promise<WebviewWindow | null> {
  return await WebviewWindow.getByLabel(windowId);
}

export async function isWindowOpen(windowId: string): Promise<boolean> {
  const window = await WebviewWindow.getByLabel(windowId);
  return window !== null;
}

export async function focusSecondaryWindow(windowId: string): Promise<boolean> {
  const window = await WebviewWindow.getByLabel(windowId);
  if (!window) return false;

  try {
    await window.setFocus();
    return true;
  } catch (err) {
    console.warn(`[TauriWindows] No se pudo enfocar ventana "${windowId}":`, err);
    return false;
  }
}

export async function listenToWindowEvent<T = any>(
  windowId: string,
  eventName: string,
  handler: (data: T) => void
): Promise<() => void> {
  const fullEventName = `${windowId}:${eventName}`;

  const unlisten = await listen<T>(fullEventName, (event) => {
    console.log(`[TauriWindows] Evento recibido "${fullEventName}":`, event.payload);
    handler(event.payload);
  });

  return unlisten;
}

export async function emitToWindow<T = any>(
  windowId: string,
  eventName: string,
  data: T
): Promise<void> {
  const fullEventName = `${windowId}:${eventName}`;
  console.log(`[TauriWindows] Emitiendo evento "${fullEventName}":`, data);
  await emit(fullEventName, data);
}

// Lista de todas las ventanas abiertas
export async function getAllOpenWindows(): Promise<string[]> {
  const windows = await WebviewWindow.getAll();
  if (windows) {
    return windows.map((w: WebviewWindow) => w.label);
  } else {
    return [];
  }
}


// // Tipos de eventos comunes que pueden emitir las ventanas
// export const WINDOW_EVENTS = {
//   PRODUCT_SELECTED: 'product-selected',
//   PRODUCT_MULTI_SELECTED: 'product-multi-selected',
//   WINDOW_CLOSED: 'window-closed',

//   DATA_UPDATED: 'data-updated',
//   CANCEL: 'cancel',
//   CONFIRM: 'confirm',
// } as const;

// export type WindowEventType = typeof WINDOW_EVENTS[keyof typeof WINDOW_EVENTS];
