import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { TooltipProvider } from './components/atoms/tooltip.tsx';
import './index.css';
import Navigation from './navigation/Navigation.tsx';
// import { Toaster as Sonner } from "./components/atoms/sonner.tsx";
import '@/config/zodI18nConfig.ts';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { Toaster } from './components/atoms/toaster.tsx';
import { WebSocketProvider } from './contexts/WebSocketContext.tsx';
import { initializeKeybindingStore } from './keybindings/index.ts';
import { queryClient } from './lib/reactQueryConfig.ts';

// ✨ Inicializar keybindings de forma asíncrona SIN bloquear el renderizado
initializeKeybindingStore().catch((error) => {
  console.error('❌ Error initializing keybinding store:', error);
});

createRoot(document.getElementById('root')!).render(
  <WebSocketProvider>
    <QueryClientProvider client={queryClient}>
      <HotkeysProvider initiallyActiveScopes={['default', 'esc-key']}>
        <TooltipProvider>
          <Toaster />
          {/* <Sonner /> */}
          {/* <KeybindingProvider> */}
            <BrowserRouter>
              {/* <SidebarProvider> */}
              <Navigation />
              {/* </SidebarProvider> */}
            </BrowserRouter>
          {/* </KeybindingProvider> */}
        </TooltipProvider>
      </HotkeysProvider>
    </QueryClientProvider>
  </WebSocketProvider>
);
