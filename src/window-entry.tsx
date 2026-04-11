import WindowLayout from "@/layouts/WindowLayout";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
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
// All secondary windows are opened with ?windowId=... in the URL by tauriWindows.ts.
const isSecondaryWindow =
  new URLSearchParams(window.location.search).get("windowId") !== null;

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
(async () => {
  const selfWindow = getCurrentWebviewWindow();
  const windowId = new URLSearchParams(window.location.search).get("windowId");

  // Cuando el OS dispara X o se llama window.close() desde cualquier lado,
  // este handler (en el contexto propio de la ventana) emite el evento y deja
  // que Tauri cierre la ventana normalmente (sin preventDefault).
  // Handler SÍNCRONO — en Tauri v2 un handler async bloquea el cierre hasta
  // que el Promise resuelve. El emit va fire-and-forget; Tauri cierra la
  // ventana de inmediato al retornar el handler sin preventDefault().
  selfWindow.onCloseRequested(() => {
    if (windowId) {
      emit(`${windowId}:window-closed`, { canceled: false }).catch(() => {});
    }
  });
})();

// Guard anti-zombie: si el heartbeat de la ventana principal se detiene por más de
// 5 segundos (reload, crash, o cierre), esta ventana secundaria se auto-cierra.
(async () => {
  const TIMEOUT_MS = 5000;
  let lastHeartbeat = Date.now();

  const unlisten = await listen("main:heartbeat", () => {
    lastHeartbeat = Date.now();
  });

  const interval = setInterval(async () => {
    if (Date.now() - lastHeartbeat > TIMEOUT_MS) {
      clearInterval(interval);
      unlisten();
      console.log("[WindowEntry] Main window heartbeat lost — closing orphan window");
      await getCurrentWebviewWindow().close();
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

  console.log("[WindowEntry] ✅ Aplicación renderizada");
} else {
  console.error("[WindowEntry] ❌ No se encontró el elemento #window-root");
}
