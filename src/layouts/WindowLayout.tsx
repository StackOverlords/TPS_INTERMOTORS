import { Toaster } from '@/components/atoms/toaster';
import { TooltipProvider } from '@/components/atoms/tooltip';
// import { KeybindingProvider } from '@/contexts/KeybindingContext'; // ⚠️ DEPRECATED: Reemplazado por el nuevo sistema de keybindings con Zustand
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { queryClient } from '@/lib/reactQueryConfig';
import authSDK from '@/services/sdk-simple-auth';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

interface WindowLayoutProps {
  children: React.ReactNode;
}

const WindowLayout: React.FC<WindowLayoutProps> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const checkAuthReady = async () => {
      try {
        // Intentar obtener el token desde IndexedDB
        const token = await authSDK.getAccessToken();
        if (token) {
          setIsAuthReady(true);
        } else {
          // Si no hay token, esperar un poco más y reintentar
          setTimeout(async () => {
            const retryToken = await authSDK.getAccessToken();
            setIsAuthReady(!!retryToken);
          }, 300);
        }
      } catch (error) {
        console.error('[WindowLayout] Error checking auth:', error);
        // Marcar como ready de todos modos después de un timeout
        setTimeout(() => setIsAuthReady(true), 500);
      }
    };

    checkAuthReady();
  }, []);

  // Mostrar un loading mientras espera el auth
  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // ⚠️ DEPRECATED: KeybindingProvider removido - Ahora usamos Zustand store
  return (
    <WebSocketProvider>
      <QueryClientProvider client={queryClient}>
        {/* <HotkeysProvider initiallyActiveScopes={['default', 'esc-key']}> */}
        <TooltipProvider>
          <Toaster />
          <div className="h-screen w-screen overflow-hidden">
            {children}
          </div>
        </TooltipProvider>
        {/* </HotkeysProvider> */}
      </QueryClientProvider>
    </WebSocketProvider>
  );
};

export default WindowLayout;
