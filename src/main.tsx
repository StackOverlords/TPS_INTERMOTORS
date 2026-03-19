import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { TooltipProvider } from "./components/atoms/tooltip.tsx";
import "./index.css";
import Navigation from "./navigation/Navigation.tsx";
// import { Toaster as Sonner } from "./components/atoms/sonner.tsx";
import "@/config/zodI18nConfig.ts";
import { HotkeysProvider, useHotkeys } from "react-hotkeys-hook";
import { Toaster } from "./components/atoms/toaster.tsx";
import { ZoomManager } from "./components/common/ZoomManager.tsx";
import TitleBar from "./components/common/TitleBar.tsx";
import { TaskNotificationsProvider } from "./contexts/TaskNotificationsContext.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";
import { useDebugLogWindow } from "./hooks/useSecondaryWindow";
import { initializeKeybindingStore } from "./keybindings/index.ts";
import { queryClient } from "./lib/reactQueryConfig.ts";
// import { useThemeStore } from "./stores/themeStore.ts";
import logger from "./utils/logger.ts";
// import { useAppearanceStore } from "./stores/appearanceStore.ts";
import { flushTabStorage } from "./states/tabStore.ts";
import { emit } from "@tauri-apps/api/event";
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


function App() {
  const debugLogWindow = useDebugLogWindow();

  // Atajos de teclado globales para abrir el panel de debug
  useHotkeys(
    "ctrl+shift+d, meta+shift+d",
    () => {
      debugLogWindow.toggle();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "f12",
    () => {
      debugLogWindow.toggle();
    },
    { enableOnFormTags: true }
  );

  // ✅ Forzar guardado de tabs antes de cerrar la aplicación
  // Esto previene pérdida de datos cuando el usuario cierra antes de los 300ms del debounce
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushTabStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Heartbeat para ventanas secundarias: emite cada 2s para que puedan detectar
  // si la ventana principal fue cerrada o recargada y auto-cerrarse (anti-zombie).
  useEffect(() => {
    const interval = setInterval(() => {
      emit("main:heartbeat").catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TaskNotificationsProvider>
        <WebSocketProvider>
          <HotkeysProvider initiallyActiveScopes={["default", "esc-key"]}>
            <TooltipProvider>
              <Toaster />
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
        </WebSocketProvider>
      </TaskNotificationsProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
