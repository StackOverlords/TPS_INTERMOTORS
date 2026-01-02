export const environment = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  branch_selected_key: import.meta.env.BRANCH_STORAGE_KEY || 'key_branch',
  app_env: import.meta.env.VITE_APP_ENV || 'production',
  env: import.meta.env.VITE_APP_ENV || 'production',
};

/**
 * Detecta si la aplicación está corriendo en Tauri
 */
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

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
  };
};