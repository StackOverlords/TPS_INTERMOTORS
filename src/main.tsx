import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { TooltipProvider } from "./components/atoms/tooltip.tsx";
import "./index.css";
import Navigation from "./navigation/Navigation.tsx";
// import { Toaster as Sonner } from "./components/atoms/sonner.tsx";
import "@/config/zodI18nConfig.ts";
import { HotkeysProvider } from "react-hotkeys-hook";
import { Toaster } from "./components/atoms/toaster.tsx";
import { ZoomManager } from "./components/common/ZoomManager.tsx";
import TitleBar from "./components/common/TitleBar.tsx";
import { TaskNotificationsProvider } from "./contexts/TaskNotificationsContext.tsx";
// import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";
import { initializeKeybindingStore } from "./keybindings/index.ts";
import { queryClient } from "./lib/reactQueryConfig.ts";
// import { useThemeStore } from "./stores/themeStore.ts";
import logger from "./utils/logger.ts";
// import { useAppearanceStore } from "./stores/appearanceStore.ts";
import { flushTabStorage } from "./states/tabStore.ts";
import { getWindowManager } from "@/platform";
import { PluginDialogHost } from "./plugins/components/PluginDialogHost.tsx";
import { PluginKeybindingHost } from "./plugins/components/PluginKeybindingHost.tsx";
import { useEffect } from "react";

// try {
//   useThemeStore.getState().initializeTheme();
//   useAppearanceStore.getState().initializeAppearance();
// } catch (error) {
//   logger.error("Error inicializando tema y apariencia: ", error);
// }

// ✨ Inicializar keybindings de forma asíncrona SIN bloquear el renderizado
initializeKeybindingStore().catch((error) => {
  logger.error("❌ Error initializing keybinding store:", error);
});

// ✨ [DEV-ONLY] Activar plugins de desarrollo cuando VITE_DEV_PLUGINS=1
// No se ejecuta en producción — el flag nunca se setea en el entorno de build.
if (import.meta.env.VITE_DEV_PLUGINS === "1") {
  import("./plugins/__dev__/bootstrap").then(({ bootstrapDevPlugins }) => {
    bootstrapDevPlugins().catch((e) => {
      console.error("[dev-plugins] bootstrap failed:", e);
    });
  }).catch((e) => {
    console.error("[dev-plugins] import failed:", e);
  });
}

// ✨ [PRODUCTION] Cargar plugins externos instalados vía Module Federation.
// Siempre activo — los plugins externos son primera clase, no solo dev.
// Best-effort: errores aislados por plugin (no tumban la app ni el bootstrap dev).
import("./plugins/loadExternalPlugins")
  .then(({ loadExternalPlugins }) =>
    import("./plugins/sources/TauriPluginSource").then(({ TauriPluginSource }) =>
      import("./plugins/plugin-manager").then(({ PluginManager }) =>
        loadExternalPlugins(new TauriPluginSource(), PluginManager)
      )
    )
  )
  .then((results) =>
    // Exponer los resultados a la UI de gestión (badges de error de carga).
    // Import dinámico: módulo liviano, no arrastra la pantalla PluginSettings.
    import("./plugins/bootstrapLoadResults").then(({ setBootstrapLoadResults }) => {
      setBootstrapLoadResults(results);
      const failed = results.filter((r) => r.status === "failed");
      if (failed.length > 0) {
        logger.warn("[external-plugins] Plugins con error:", failed);
      }
    })
  )
  .catch((e) => {
    logger.error("[external-plugins] bootstrap failed:", e);
  });

function App() {
  // ✅ Forzar guardado de tabs antes de cerrar la aplicación
  // Esto previene pérdida de datos cuando el usuario cierra antes de los 300ms del debounce
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushTabStorage();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Al montar (incluyendo reloads), cerrar todas las ventanas secundarias huérfanas.
  // Es la defensa principal contra zombies: cuando el main recarga, el primer efecto
  // que corre destruye cualquier ventana secundaria que quedó abierta.
  useEffect(() => {
    const killOrphanWindows = async () => {
      try {
        await getWindowManager().closeAllSecondary();
      } catch {
        // no-op: si falla el cierre, el heartbeat las recoge igual
      }
    };
    killOrphanWindows();
  }, []);

  // Heartbeat como capa secundaria: cubre el caso de crash del main (no reload).
  // Las ventanas secundarias se auto-cierran si no reciben pulso por 5s.
  useEffect(() => {
    const interval = setInterval(() => {
      getWindowManager().broadcast("main:heartbeat").catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TaskNotificationsProvider>
        {/* <WebSocketProvider> */}
        <HotkeysProvider initiallyActiveScopes={["default", "esc-key"]}>
          <TooltipProvider>
            <Toaster />
            <PluginDialogHost />
            <PluginKeybindingHost />
            <ZoomManager />
            {/* <Sonner /> */}
            {/* <KeybindingProvider> */}
            <BrowserRouter>
              <div className="flex flex-col h-screen w-screen overflow-hidden">
                <TitleBar />
                {/* <SidebarProvider> */}
                <div className="min-h-0 flex-1">
                  <Navigation />
                </div>
                {/* </SidebarProvider> */}
              </div>
            </BrowserRouter>
            {/* </KeybindingProvider> */}
          </TooltipProvider>
        </HotkeysProvider>
        {/* </WebSocketProvider> */}
      </TaskNotificationsProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
