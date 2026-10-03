import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Plugin sonda de facturación — remote de Module Federation.
 *
 * A diferencia de hello-external, este está pensado para servirse por HTTP
 * desde el backend, no para instalarse a disco. `base: "./"` hace que los
 * chunks se pidan relativos al remoteEntry.js, así el mismo build funciona
 * bajo cualquier prefijo de URL (/api/v1/plugin-assets/<id>/...) sin rebuild.
 */
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: "facturacionPlugin",
      filename: "remoteEntry.js",
      exposes: {
        "./plugin": "./src/plugin.tsx",
      },

      /**
       * Sin generación de tipos del remote.
       *
       * El DTS de Module Federation existe para que OTRO build importe este
       * remote con tipos. Acá no pasa eso: el host carga el plugin en runtime
       * por `remoteEntry.js` y solo conoce el contrato de `@tps/plugin-sdk`,
       * que ya está tipado por su cuenta. Nadie consume tipos de este bundle.
       *
       * Además fallaba siempre, por dos motivos ajenos al código del plugin:
       * el tsconfig que genera el dts-plugin fija `rootDir` en esta carpeta y
       * el SDK vive fuera (`packages/plugin-sdk`, resuelto por alias), y no
       * levanta las declaraciones de `?inline` de `src/vite-env.d.ts`.
       *
       * El type-check de verdad sigue estando: `tsc --noEmit -p tsconfig.json`.
       */
      dts: false,
      shared: {
        // Singletons obligatorios: si el plugin trae su propio React, los hooks
        // se rompen (dos instancias, dos dispatchers).
        react: { singleton: true, requiredVersion: "19.1.0" },
        "react-dom": { singleton: true, requiredVersion: "19.1.0" },
      },
    }),
  ],
  resolve: {
    alias: {
      // El SDK es cero-runtime: se bundlea directo, no hace falta compartirlo.
      "@tps/plugin-sdk": path.resolve(
        __dirname,
        "../../packages/plugin-sdk/src/index.ts"
      ),
    },
  },
  build: {
    target: "chrome89",
    minify: false,
  },
});
