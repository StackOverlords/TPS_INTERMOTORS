import { isTauri } from '@/platform/env';

export const environment = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  branch_selected_key: import.meta.env.BRANCH_STORAGE_KEY || 'key_branch',
  app_env: import.meta.env.VITE_APP_ENV || 'production',
  env: import.meta.env.VITE_APP_ENV || 'production',
  variant: import.meta.env.VITE_APP_VARIANT || null,
};

/**
 * Detecta si la aplicación está corriendo en Tauri.
 *
 * Delega en `platform/env` para que haya UNA sola fuente de verdad: esa versión
 * además chequea `__TAURI_INTERNALS__`, que es el global real del runtime v2
 * (`__TAURI__` solo existe con `withGlobalTauri: true`).
 */
export const isTauriEnvironment = (): boolean => isTauri();

/**
* Detecta si el navegador soporta la API de impresión
*/
export const supportsPrint = (): boolean => {
  return typeof window !== 'undefined' && 'print' in window;
};

/**
* Detecta el entorno de ejecución
*/
export const getEnvironment = () => {
  const isTauri = isTauriEnvironment();
  const canPrint = supportsPrint();

  return {
    isTauri,
    isBrowser: !isTauri,
    canPrint,
    environment: isTauri ? 'tauri' : 'browser',
    env: import.meta.env.VITE_APP_ENV || 'production',
    variant: import.meta.env.VITE_APP_VARIANT || null
  };
};