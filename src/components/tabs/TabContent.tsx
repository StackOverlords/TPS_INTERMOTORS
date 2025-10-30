import { useTabStore } from '@/states/tabStore';
import React, { useEffect, useRef, type ReactNode } from 'react';

interface TabContentProps {
  children: ReactNode;
  tabId: string;
}

const TabContentComponent: React.FC<TabContentProps> = ({ children, tabId }) => {
  // Selectores específicos para evitar re-renders innecesarios
  const activeTabId = useTabStore(state => state.activeTabId);
  const updateTab = useTabStore(state => state.updateTab);
  const getTab = useTabStore(state => state.getTab);

  const isActive = tabId === activeTabId;
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
      className="h-full overflow-auto"
      style={{
        display: isActive ? 'block' : 'none',
      }}
    >
      {children}
    </div>
  );
};

// Memoización agresiva: solo re-render si el estado activo cambia
const TabContent = React.memo(TabContentComponent, (prev, next) => {
  // Solo re-renderizar si el tabId cambió o si cambió de activo/inactivo
  if (prev.tabId !== next.tabId) return false;

  const store = useTabStore.getState();
  const prevActive = prev.tabId === store.activeTabId;
  const nextActive = next.tabId === store.activeTabId;

  return prevActive === nextActive;
});

TabContent.displayName = 'TabContent';

export default TabContent;
