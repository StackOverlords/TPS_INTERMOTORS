import WindowLayout from "@/layouts/WindowLayout";
import {
  getWindowManager,
  PLATFORM_CLOSE_ALL_SECONDARY,
} from "@/platform";
import { createRoot } from "react-dom/client";
import { AuthSDKContext } from "./contexts/AuthSDKContext.tsx";
import { TaskNotificationsProvider } from "./contexts/TaskNotificationsContext.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";
import "./index.css";
import { initializeKeybindingStore } from "./keybindings/index.ts";
import authSDK from "./services/sdk-simple-auth.ts";
import {
  registerDefaultWindowComponents,
  WindowComponentRenderer,
} from "./windows/WindowRegistry";
import { useThemeStore } from "./stores/themeStore.ts";
import { useAppearanceStore } from "./stores/appearanceStore.ts";

// Detect if this entry point is running in a secondary window.
// Todas las ventanas secundarias se abren con ?windowId=... en la URL
// (ver src/platform/ports/windowManager.ts).
const platformWindows = getWindowManager();
const isSecondaryWindow = platformWindows.isSecondaryWindow();

// The module-level authSDK singleton auto-detects isSecondary via URLSearchParams,
// so it's already correctly configured for secondary windows (validateOnStartup: false).
// We re-export it here for the AuthSDKContext.Provider — no need to create a second instance.
export const windowAuthSDK = isSecondaryWindow ? authSDK : undefined;

try {
  useThemeStore.getState().initializeTheme();
  useAppearanceStore.getState().initializeAppearance();
} catch (error) {
  console.error("[WindowEntry] ❌ Error inicializando tema y apariencia:", error);
}

// Cada ventana secundaria maneja su propio cierre desde su propio contexto.
// Esto evita que un onCloseRequested registrado desde el main quede "muerto"
// en Tauri esperando una respuesta que nunca llega (root cause del zombie).
(() => {
  const windowId = platformWindows.getCurrentWindowId();
  if (!windowId) return;

  // Cuando el usuario cierra la ventana (X del SO o del navegador), este handler
  // —en el contexto propio de la ventana— avisa al padre y deja que el cierre
  // siga su curso. Handler SÍNCRONO: en Tauri v2 un handler async bloquea el
  // cierre hasta que el Promise resuelve (causa raíz de las ventanas zombie),
  // y en web `beforeunload` tampoco espera promesas. El aviso va
  // fire-and-forget en los dos targets.
  platformWindows.onCurrentWindowClose(() => {
    platformWindows
      .emitToWindow(windowId, "window-closed", { canceled: false })
      .catch(() => {});
  });

  // Orden global de cierre emitida por la ventana principal
  // (`closeAllSecondary`). Cada ventana cierra desde su propio contexto.
  platformWindows.subscribe(PLATFORM_CLOSE_ALL_SECONDARY, () => {
    platformWindows.closeCurrentWindow().catch(() => {});
  });
})();

// Guard anti-zombie: si el heartbeat de la ventana principal se detiene por más de
// 5 segundos (reload, crash, o cierre), esta ventana secundaria se auto-cierra.
(async () => {
  const TIMEOUT_MS = 5000;
  let lastHeartbeat = Date.now();

  const unlisten = await platformWindows.subscribe("main:heartbeat", () => {
    lastHeartbeat = Date.now();
  });

  const interval = setInterval(async () => {
    if (Date.now() - lastHeartbeat > TIMEOUT_MS) {
      clearInterval(interval);
      unlisten();
      console.log("[WindowEntry] Main window heartbeat lost — closing orphan window");
      await platformWindows.closeCurrentWindow();
    }
  }, 1000);
})();

// ✨ Inicializar keybindings de forma asíncrona en ventanas secundarias
// NO bloqueamos el renderizado si falla
initializeKeybindingStore().catch((error) => {
  console.error("[WindowEntry] ❌ Error initializing keybinding store:", error);
});

registerDefaultWindowComponents();

// Montar la aplicación standalone
const rootElement = document.getElementById("window-root");

// Componentes que no requieren autenticación
const NO_AUTH_COMPONENTS = ["debug-log"];

// Detectar si el componente actual requiere auth
const params = new URLSearchParams(window.location.search);
const componentId = params.get("component");
const requiresAuth = componentId
  ? !NO_AUTH_COMPONENTS.includes(componentId)
  : true;

if (rootElement) {
  const mount = () => {
    createRoot(rootElement).render(
      requiresAuth ? (
        <AuthSDKContext.Provider value={windowAuthSDK ?? authSDK}>
          <TaskNotificationsProvider>
            <WebSocketProvider>
              <WindowLayout>
                <WindowComponentRenderer />
              </WindowLayout>
            </WebSocketProvider>
          </TaskNotificationsProvider>
        </AuthSDKContext.Provider>
      ) : (
        <WindowComponentRenderer />
      )
    );
  };

  if (isSecondaryWindow && requiresAuth) {
    authSDK.ready
      .then(() => {
        mount();
      })
      .catch((error) => {
        console.error("[WindowEntry] ❌ SDK ready failed:", error);
        mount();
      });
  } else {
    mount();
  }
} else {
  console.error("[WindowEntry] ❌ No se encontró el elemento #window-root");
}
