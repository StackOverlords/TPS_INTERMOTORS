import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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
    federation({
      name: "facturacionPlugin",
      filename: "remoteEntry.js",
      exposes: {
        "./plugin": "./src/plugin.tsx",
      },
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
