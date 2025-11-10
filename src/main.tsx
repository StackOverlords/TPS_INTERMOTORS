import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { TooltipProvider } from './components/atoms/tooltip.tsx';
import './index.css';
import Navigation from './navigation/Navigation.tsx';
// import { Toaster as Sonner } from "./components/atoms/sonner.tsx";
import '@/config/zodI18nConfig.ts';
import { HotkeysProvider, useHotkeys } from 'react-hotkeys-hook';
import { Toaster } from './components/atoms/toaster.tsx';
import { WebSocketProvider } from './contexts/WebSocketContext.tsx';
import { initializeKeybindingStore } from './keybindings/index.ts';
import { queryClient } from './lib/reactQueryConfig.ts';
import { useDebugLogWindow } from './hooks/useSecondaryWindow';

// ✨ Inicializar keybindings de forma asíncrona SIN bloquear el renderizado
initializeKeybindingStore().catch((error) => {
  console.error('❌ Error initializing keybinding store:', error);
});

function App() {
  const debugLogWindow = useDebugLogWindow();

  // Atajos de teclado globales para abrir el panel de debug
  useHotkeys('ctrl+shift+d, meta+shift+d', () => {
    debugLogWindow.toggle();
  }, { enableOnFormTags: true });

  useHotkeys('f12', () => {
    debugLogWindow.toggle();
  }, { enableOnFormTags: true });

  return (
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
}

createRoot(document.getElementById('root')!).render(<App />);
