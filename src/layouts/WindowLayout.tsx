import { Toaster } from "@/components/atoms/toaster";
import { TooltipProvider } from "@/components/atoms/tooltip";
import SecondaryTitleBar from "@/components/common/SecondaryTitleBar";
import { ZoomManager } from "@/components/common/ZoomManager";
// import { KeybindingProvider } from '@/contexts/KeybindingContext'; // ⚠️ DEPRECATED: Reemplazado por el nuevo sistema de keybindings con Zustand
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { queryClient } from "@/lib/reactQueryConfig";
import authSDK from "@/services/sdk-simple-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { HotkeysProvider } from "react-hotkeys-hook";

interface WindowLayoutProps {
  children: React.ReactNode;
}

const WindowLayout: React.FC<WindowLayoutProps> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    authSDK.ready.then(() => setIsAuthReady(true));
  }, []);

  // Mostrar un loading mientras espera el auth
  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // ⚠️ DEPRECATED: KeybindingProvider removido - Ahora usamos Zustand store
  return (
    <WebSocketProvider>
      <QueryClientProvider client={queryClient}>
        <HotkeysProvider initiallyActiveScopes={["default", "esc-key"]}>
          <TooltipProvider>
            <Toaster />
            <ZoomManager />
            <div className="h-screen w-screen overflow-hidden flex flex-col">
              <SecondaryTitleBar />
              <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
            </div>
          </TooltipProvider>
        </HotkeysProvider>
      </QueryClientProvider>
    </WebSocketProvider>
  );
};

export default WindowLayout;
