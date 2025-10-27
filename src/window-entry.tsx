import WindowLayout from '@/layouts/WindowLayout';
import { createRoot } from 'react-dom/client';
import './index.css';
import {
  registerDefaultWindowComponents,
  WindowComponentRenderer,
} from './windows/WindowRegistry';

registerDefaultWindowComponents();

// Montar la aplicación standalone
const rootElement = document.getElementById('window-root');

if (rootElement) {
  createRoot(rootElement).render(
    <WindowLayout>
      <WindowComponentRenderer />
    </WindowLayout>
  );
} 
// else {
//   console.error('[WindowEntry] No se encontró el elemento root');
// }
