import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path, { resolve } from 'path';
import { readFileSync } from 'fs';

// Version de la app disponible en runtime para ambos targets. En escritorio la
// da `getVersion()` de Tauri; en web no hay equivalente, asi que se inyecta en
// build desde package.json (unica fuente de verdad, la misma que usa Tauri).
const appVersion = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8'),
).version as string;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        window: resolve(__dirname, 'window.html'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-checkbox',
          ],
          'table-vendor': ['@tanstack/react-table', '@tanstack/react-query'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  esbuild:{
    drop: [ 'debugger'],
  },
  // Clear screen on rebuild
  clearScreen: false,
  // Only expose VITE_* and Tauri's build-context TAURI_ENV_* vars to the client.
  // A bare 'TAURI_' prefix would also inline TAURI_SIGNING_PRIVATE_KEY (and its
  // password) into the shipped bundle, since the release workflow sets them on
  // the same step that runs `vite build`.
  envPrefix: ['VITE_', 'TAURI_ENV_'],
})
