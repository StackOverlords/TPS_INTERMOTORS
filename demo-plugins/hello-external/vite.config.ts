import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Plugin remoto externo — Hello External (Fase 5 TPS_INTERMOTORS).
 *
 * Se buildea como "remote" de Module Federation y expone su contrato Plugin en ./plugin.
 * El host lo carga con loadRemote("helloExternal/plugin") tras la instalación a disco.
 *
 * NOTA base: el remoteEntry.js se sirve via asset://localhost/<abs-path>/remoteEntry.js.
 * @module-federation/vite usa publicPath:"auto" por defecto, que deriva el origen desde
 * document.currentScript.src en runtime — correcto para asset:// + file-system serving.
 * Si el build hardcodeara rutas absolutas /assets/..., agregar base: "./" resolvería.
 * Se mantiene sin base:"./" como primera prueba (auto es más robusto en asset://).
 */
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "helloExternal",
      filename: "remoteEntry.js",
      exposes: {
        // Contrato principal: el host carga "helloExternal/plugin"
        "./plugin": "./src/plugin.tsx",
      },
      shared: {
        // React compartido como singleton — CRITICO para que los hooks funcionen.
        // El host provee la instancia; el plugin no bundlea su propio React.
        react: { singleton: true, requiredVersion: "19.1.0" },
        "react-dom": { singleton: true, requiredVersion: "19.1.0" },
      },
    }),
  ],
  resolve: {
    alias: {
      // SDK es cero-runtime: se bundlea directo en el remoto — no necesita ser shared.
      // El path navega desde demo-plugins/hello-external/ hasta packages/plugin-sdk/
      "@tps/plugin-sdk": path.resolve(
        __dirname,
        "../../packages/plugin-sdk/src/index.ts"
      ),
    },
  },
  build: {
    // Target moderno requerido por @module-federation/vite (top-level await)
    target: "chrome89",
    minify: false,
  },
  // Sin server/preview: este plugin NO se sirve por HTTP.
  // Se instala a disco y el host lo sirve via asset:// protocol de Tauri 2.
});
