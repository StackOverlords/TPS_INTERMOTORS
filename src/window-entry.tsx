import WindowLayout from "@/layouts/WindowLayout";
import {
  getWindowManager,
  PLATFORM_CLOSE_ALL_SECONDARY,
} from "@/platform";
import { createRoot } from "react-dom/client";
import { AuthSDKContext } from "./contexts/AuthSDKContext.tsx";
import { TaskNotificationsProvider } from "./contexts/TaskNotificationsContext.tsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary.tsx";
import { Button } from "./components/atoms/button.tsx";
import { ensureSecondaryWindowSession } from "./services/secondaryWindowSession.ts";
import "./index.css";
import { initializeKeybindingStore } from "./keybindings/index.ts";
import authSDK from "./services/sdk-simple-auth.ts";
import {
  registerDefaultWindowComponents,
  WindowComponentRenderer,
} from "./windows/WindowRegistry";
import { useThemeStore } from "./stores/themeStore.ts";
import { useAppearanceStore } from "./stores/appearanceStore.ts";
import { applyCachedColorTheme } from "./themes/applyColorTheme.ts";

// Detect if this entry point is running in a secondary window.
// Todas las ventanas secundarias se abren con ?windowId=... en la URL
// (ver src/platform/ports/windowManager.ts).
const platformWindows = getWindowManager();
const isSecondaryWindow = platformWindows.isSecondaryWindow();

// The module-level authSDK singleton auto-detects isSecondary via URLSearchParams,
// so it's already correctly configured for secondary windows (validateOnStartup: false).
// We re-export it here for the AuthSDKContext.Provider — no need to create a second instance.
export const windowAuthSDK = isSecondaryWindow ? authSDK : undefined;

// Tema de color: el mismo que la ventana principal, y en vivo si cambia allá.
applyCachedColorTheme();

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
// Todas las ventanas secundarias requieren sesión.
const NO_AUTH_COMPONENTS: string[] = [];

// Detectar si el componente actual requiere auth
const params = new URLSearchParams(window.location.search);
const componentId = params.get("component");
const requiresAuth = componentId
  ? !NO_AUTH_COMPONENTS.includes(componentId)
  : true;

/**
 * Si algo falla fuera del ErrorBoundary de cada selector (layout, providers,
 * barra de título), la ventana quedaba en blanco y, sin la barra de título ni
 * bordes nativos (decorations: false), ni siquiera se podía cerrar.
 */
const windowCrashFallback = (
  <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
    <p className="text-base font-semibold">Esta ventana tuvo un problema al cargarse</p>
    <p className="text-sm text-muted-foreground">
      Puedes recargarla, o cerrarla y volver a abrirla desde la ventana principal.
    </p>
    <div className="flex gap-2">
      <Button size="sm" onClick={() => window.location.reload()}>
        Recargar
      </Button>
      <Button size="sm" variant="outline" onClick={() => void platformWindows.closeCurrentWindow()}>
        Cerrar ventana
      </Button>
    </div>
  </div>
);

if (rootElement) {
  const mount = () => {
    createRoot(rootElement).render(
      <ErrorBoundary name="ventana secundaria" fallback={windowCrashFallback}>
        {requiresAuth ? (
          <AuthSDKContext.Provider value={windowAuthSDK ?? authSDK}>
            <TaskNotificationsProvider>
              {/* WindowLayout trae su propio WebSocketProvider: uno acá afuera
                  abría una segunda conexión por ventana que nadie usaba. */}
              <WindowLayout>
                <WindowComponentRenderer />
              </WindowLayout>
            </TaskNotificationsProvider>
          </AuthSDKContext.Provider>
        ) : (
          <WindowComponentRenderer />
        )}
      </ErrorBoundary>
    );
  };

  if (isSecondaryWindow && requiresAuth) {
    // Espera la sesión restaurada y, si el token guardado venció, pide una
    // vigente a la ventana principal antes de montar. Mientras tanto se ve el
    // indicador de carga que trae window.html (no una pantalla en blanco).
    ensureSecondaryWindowSession()
      .catch((error) => {
        console.error("[WindowEntry] ❌ No se pudo preparar la sesión:", error);
        return false;
      })
      .finally(mount);
  } else {
    mount();
  }
} else {
  console.error("[WindowEntry] ❌ No se encontró el elemento #window-root");
}
