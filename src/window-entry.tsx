import WindowLayout from "@/layouts/WindowLayout";
import { createRoot } from "react-dom/client";
import { TaskNotificationsProvider } from "./contexts/TaskNotificationsContext.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";
import "./index.css";
import { initializeKeybindingStore } from "./keybindings/index.ts";
import {
  registerDefaultWindowComponents,
  WindowComponentRenderer,
} from "./windows/WindowRegistry";
import { useThemeStore } from "./stores/themeStore.ts";

try {
  useThemeStore.getState().initializeTheme();
} catch (error) {
  console.error("[WindowEntry] ❌ Error inicializando tema:", error);
}

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
      <TaskNotificationsProvider>
        <WebSocketProvider>
          <WindowLayout>
            <WindowComponentRenderer />
          </WindowLayout>
        </WebSocketProvider>
      </TaskNotificationsProvider>
    ) : (
      <WindowComponentRenderer />
    )
  );

  console.log("[WindowEntry] ✅ Aplicación renderizada");
} else {
  console.error("[WindowEntry] ❌ No se encontró el elemento #window-root");
}
