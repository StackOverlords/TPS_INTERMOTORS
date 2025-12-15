// Este archivo controla cuántas tabs permanecen montadas en memoria
// para preservar su estado (formularios, datos cargados, scroll, etc.)

export const TABS_CONFIG = { 
  MAX_MOUNTED_TABS: 5, 
  DEBUG_MODE: false,
} as const;

export type TabsConfig = typeof TABS_CONFIG;
