import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { defineConfig, type Plugin, type Rollup } from 'vite';
import path, { resolve } from 'path';
import { readFileSync } from 'fs';

// Version de la app disponible en runtime para ambos targets. En escritorio la
// da `getVersion()` de Tauri; en web no hay equivalente, asi que se inyecta en
// build desde package.json (unica fuente de verdad, la misma que usa Tauri).
const appVersion = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8'),
).version as string;

// Target del artefacto. Sin la variable => 'tauri', para que los comandos que
// invoca Tauri (`npm run dev`, `npm run build`) sigan funcionando sin cambios.
const buildTarget = process.env.BUILD_TARGET === 'web' ? 'web' : 'tauri';

/**
 * Precarga el camino crítico del arranque con Module Federation.
 *
 * El host no arranca con `main.js`: el index.html carga un bootstrap que
 * importa `hostInit`, que trae el runtime de federación, que carga el mapa de
 * módulos compartidos, que carga react, react-dom, router, zustand... y recién
 * al final importa `main`. Cada eslabón se descubre al ejecutar el anterior,
 * así que el navegador los pide DE A UNO: 15 viajes en serie antes de empezar
 * a bajar la app (~1,4 s con 80 ms de latencia en el deploy web).
 *
 * `modulepreload` descarga y compila sin ejecutar, así que se puede pedir todo
 * ese camino en paralelo desde el HTML sin cambiar el orden de ejecución: la
 * federación sigue inicializándose antes que la app, como antes.
 *
 * Se arma recorriendo el grafo del bundle desde lo que importa el bootstrap
 * (hostInit y la entrada del HTML): imports estáticos de todo, y además los
 * dinámicos de los chunks de la federación (así se encadenan entre sí). Los dinámicos de la app —las
 * pantallas bajo demanda— quedan afuera a propósito.
 */
function mfModulePreload(): Plugin {
  let base = '/';
  const FEDERATION_CHUNK = /hostInit|remoteEntry|loadShare|localSharedImportMap|virtual_mf|virtualExposes/;

  return {
    name: 'tps:mf-modulepreload',
    apply: 'build',
    // 'post': el HTML ya está generado (vite:build-html) y la federación todavía
    // no reemplazó su <script> de entrada por el bootstrap.
    enforce: 'post',
    configResolved(config) {
      base = config.base;
    },
    generateBundle(_options, bundle) {
      const chunks = new Map<string, Rollup.OutputChunk>();
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk') chunks.set(output.fileName, output);
      }

      const criticalPath = (roots: string[]): string[] => {
        const seen = new Set<string>();
        const pending = [...roots];
        while (pending.length > 0) {
          const fileName = pending.pop()!;
          const chunk = chunks.get(fileName);
          if (!chunk || seen.has(fileName)) continue;
          seen.add(fileName);
          pending.push(...chunk.imports);
          if (FEDERATION_CHUNK.test(fileName)) pending.push(...chunk.dynamicImports);
        }
        return [...seen];
      };

      // El chunk que trae el runtime de federación; el bootstrap lo importa primero.
      const hostInit = [...chunks.keys()].filter((fileName) => /(^|\/)hostInit-/.test(fileName));

      for (const output of Object.values(bundle)) {
        if (output.type !== 'asset' || !output.fileName.endsWith('.html')) continue;
        const html = output.source.toString();

        // Este hook corre ANTES de que la federación reemplace el <script> de
        // entrada por su bootstrap, así que acá todavía se ve la entrada real
        // (main o window). Los <link> agregados sobreviven a ese reemplazo.
        const entries = [...html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g)]
          .map((match) => match[1].slice(base.length))
          .filter((fileName) => chunks.has(fileName));
        if (entries.length === 0) continue;

        const alreadyPreloaded = new Set(
          [...html.matchAll(/rel="modulepreload"[^>]*href="([^"]+)"/g)].map((match) => match[1]),
        );
        const links = criticalPath([...hostInit, ...entries])
          .map((fileName) => base + fileName)
          .filter((href) => !alreadyPreloaded.has(href))
          .map((href) => `<link rel="modulepreload" crossorigin href="${href}">`);

        if (links.length > 0) {
          output.source = html.replace('</head>', `  ${links.join('\n  ')}\n</head>`);
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Module Federation host — always-on desde Fase 4.
    // Los remotes dinámicos se registran en runtime via registerRemotes() (sin rebuild).
    // build.target "esnext" (ya definido abajo) es requerido por el remoteEntry ESM.
    mfModulePreload(),
    federation({
      name: 'host',
      // Vacío: los plugins externos se registran en runtime con @module-federation/runtime.
      remotes: {},
      shared: {
        react: { singleton: true, requiredVersion: '19.1.0' },
        'react-dom': { singleton: true, requiredVersion: '19.1.0' },
        'react/jsx-runtime': { singleton: true, requiredVersion: '19.1.0' },
        'react-router-dom': { singleton: true, requiredVersion: '7.6.3' },
        zustand: { singleton: true, requiredVersion: '5.0.6' },
        '@tps/plugin-sdk': { singleton: true, requiredVersion: '*' },
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Selecciona el conjunto de adaptadores EN BUILD. El bundle de cada
      // target no contiene el codigo del otro: el artefacto web no arrastra
      // ni una linea de @tauri-apps.
      '@platform-adapters': path.resolve(
        __dirname,
        `./src/platform/adapters/${buildTarget}/index.ts`,
      ),
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
