import WindowLayout from '@/layouts/WindowLayout';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initializeKeybindingStore } from './keybindings/index.ts';
import {
  registerDefaultWindowComponents,
  WindowComponentRenderer,
} from './windows/WindowRegistry';

// ✨ Inicializar keybindings de forma asíncrona en ventanas secundarias
// NO bloqueamos el renderizado si falla
initializeKeybindingStore().catch((error) => {
  console.error('❌ Error initializing keybinding store in secondary window:', error);
});

registerDefaultWindowComponents();

// Montar la aplicación standalone
const rootElement = document.getElementById('window-root');

// Componentes que no requieren autenticación
const NO_AUTH_COMPONENTS = ['debug-log'];

// Detectar si el componente actual requiere auth
const params = new URLSearchParams(window.location.search);
const componentId = params.get('component');
const requiresAuth = componentId ? !NO_AUTH_COMPONENTS.includes(componentId) : true;

if (rootElement) {
  createRoot(rootElement).render(
    requiresAuth ? (
      <WindowLayout>
        <WindowComponentRenderer />
      </WindowLayout>
    ) : (
      <WindowComponentRenderer />
    )
  );
} else {
  console.error('[WindowEntry] No se encontró el elemento root');
}
