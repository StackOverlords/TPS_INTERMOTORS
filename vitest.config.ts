import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Config de tests, separada de `vite.config.ts` a propósito: los tests no
 * necesitan el plugin de React ni Tailwind, y arrancan bastante más rápido sin
 * ellos. Cuando se agreguen tests de componentes habrá que sumar `@vitejs/plugin-react`.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Los tests corren en happy-dom, o sea el target web. Los adaptadores de
      // escritorio se prueban aparte (necesitan el runtime de Tauri).
      '@platform-adapters': path.resolve(
        __dirname,
        './src/platform/adapters/web/index.ts',
      ),
    },
  },
  define: {
    // Lo inyecta `vite.config.ts` en el build real; los tests necesitan su propio valor.
    __APP_VERSION__: JSON.stringify('0.0.0-test'),
  },
  test: {
    // `happy-dom` da window/document/localStorage sin el costo de jsdom.
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
