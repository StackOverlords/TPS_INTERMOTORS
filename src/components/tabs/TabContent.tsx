import { useTabStore } from '@/states/tabStore';
import React, { useEffect, useRef, type ReactNode } from 'react';

interface TabContentProps {
  children: ReactNode;
  tabId: string;
  isActive: boolean; // Recibir isActive como prop para evitar suscripción a activeTabId
}

const TabContentComponent: React.FC<TabContentProps> = ({ children, tabId, isActive }) => {
  // Selectores específicos para evitar re-renders innecesarios
  const updateTab = useTabStore(state => state.updateTab);
  const getTab = useTabStore(state => state.getTab);
  const hasBeenActiveRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Solo marcar como activa sin causar re-render
  if (isActive && !hasBeenActiveRef.current) {
    hasBeenActiveRef.current = true;
  }

  // Guardar la posición del scroll cuando el tab se vuelve inactivo
  useEffect(() => {
    if (!isActive && containerRef.current) {
      const scrollPosition = containerRef.current.scrollTop;
      updateTab(tabId, { scrollPosition });
    }
  }, [isActive, tabId, updateTab]);

  // Restaurar la posición del scroll cuando el tab se activa
  useEffect(() => {
    if (isActive && containerRef.current) {
      const tab = getTab(tabId);
      if (tab?.scrollPosition) {
        containerRef.current.scrollTop = tab.scrollPosition;
      }
    }
  }, [isActive, tabId, getTab]);

  // ✅ Solo renderiza si ya fue activada alguna vez (lazy load)
  if (!hasBeenActiveRef.current) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto transition-opacity duration-150"
      style={{
        display: isActive ? 'block' : 'none',
        opacity: isActive ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
};

// Memoización: solo re-render si cambió el estado activo o el tabId
const TabContent = React.memo(TabContentComponent, (prev, next) => {
  // Si cambió el tabId, siempre re-renderizar
  if (prev.tabId !== next.tabId) return false;

  // Si cambió el estado activo, re-renderizar
  if (prev.isActive !== next.isActive) return false;

  // Si nada cambió, NO re-renderizar
  return true;
});

TabContent.displayName = 'TabContent';

export default TabContent;
