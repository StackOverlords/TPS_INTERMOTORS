/**
 * Adaptador web del puerto `AppUpdaterPort`.
 *
 * En web no hay binario que reemplazar: la versión desplegada la sirve el
 * backend y el usuario la toma recargando. Por eso `supportsSelfUpdate()` es
 * `false` y `checkForUpdate()` siempre devuelve `null` — la UI debe consultar
 * la capacidad y esconder la sección, no mostrar botones inertes.
 *
 * La versión sale de `__APP_VERSION__`, inyectada en build por Vite desde
 * `package.json` (ver `vite.config.ts`).
 */

import type { AppUpdaterPort } from '@/platform/ports/appUpdater';

export const webAppUpdater: AppUpdaterPort = {
  async getCurrentVersion() {
    return __APP_VERSION__;
  },

  supportsSelfUpdate() {
    return false;
  },

  async checkForUpdate() {
    return null;
  },

  async downloadAndInstall() {
    throw new Error(
      'La versión web se actualiza sola al recargar la página: no hay instalación manual.',
    );
  },

  async relaunch() {
    window.location.reload();
  },

  dismiss() {
    // No hay actualización pendiente que olvidar.
  },
};
