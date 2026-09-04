/**
 * Adaptador web del puerto `WindowChromePort`.
 *
 * El navegador es el dueño del marco de la ventana, así que `hasCustomChrome()`
 * devuelve `false` y la UI debe esconder los controles. Las operaciones se
 * mapean a lo más cercano que permite la plataforma:
 *
 *  - minimizar → no existe. No-op.
 *  - maximizar → API de pantalla completa.
 *  - cerrar    → `window.close()`, que solo funciona en ventanas abiertas por
 *                script (nuestras ventanas secundarias). En la pestaña
 *                principal el navegador lo ignora, y está bien: nadie debería
 *                poder cerrarle la pestaña al usuario.
 *  - arrastrar → no existe. No-op.
 *  - zoom      → `zoom` de CSS sobre el body.
 */

import type { WindowChromePort } from '@/platform/ports/windowChrome';

export const webWindowChrome: WindowChromePort = {
  hasCustomChrome() {
    return false;
  },

  async minimize() {
    // El navegador no expone minimizar.
  },

  async toggleMaximize() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      // requestFullscreen exige gesto del usuario y puede rechazar.
      console.warn('[WebChrome] No se pudo alternar pantalla completa:', error);
    }
  },

  async close() {
    window.close();
  },

  async isMaximized() {
    // Truthiness, no `!== null`: donde `fullscreenElement` viene `undefined`
    // (entornos que no implementan la API completa) la comparación estricta
    // daría `true` y reportaría maximizado sin estarlo.
    return Boolean(document.fullscreenElement);
  },

  async onMaximizeChange(handler: (maximized: boolean) => void) {
    const onChange = () => handler(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  },

  async startDragging() {
    // El navegador maneja el arrastre de sus propias ventanas.
  },

  async setZoom(level: number) {
    // `zoom` es no estándar pero está soportado en los navegadores de escritorio
    // actuales, y a diferencia de `transform: scale` no rompe el layout ni la
    // detección de posiciones para los popovers de Radix.
    document.body.style.zoom = String(level);
  },
};
