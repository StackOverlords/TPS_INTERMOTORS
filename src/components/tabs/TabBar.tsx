import { Button } from '@/components/atoms/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/atoms/context-menu';
import { ScrollArea, ScrollBar } from '@/components/atoms/scroll-area';
import { TooltipWrapper } from '@/components/common/TooltipWrapper';
import { cn } from '@/lib/utils';
import { useTabStore, type Tab } from '@/states/tabStore';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, X } from 'lucide-react';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';

interface TabBarProps {
  className?: string;
}

// Memoizar componente de tab individual
const TabItem = React.memo(({
  tab,
  isActive,
  onTabClick,
  onCloseTab,
  onCloseOthers,
  onCloseAll,
  canClose
}: {
  tab: Tab;
  isActive: boolean;
  onTabClick: (tab: Tab) => void;
  onCloseTab: (e: React.MouseEvent, tabId: string) => void;
  onCloseOthers: (tabId: string) => void;
  onCloseAll: () => void;
  canClose: boolean;
}) => {
  // Mostrar título completo + ruta en el tooltip
  const tooltipContent = (
    <div className="flex flex-col gap-1">
      <span className="font-medium">{tab.title}</span>
      <span className="text-xs text-gray-400">{tab.path}</span>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TooltipWrapper tooltip={tooltipContent}>
          <Button
            variant="ghost"
            onClick={() => onTabClick(tab)}
            className={cn(
              'group relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'hover:bg-gray-100',
              'min-w-[120px] max-w-[200px]',
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.icon && <tab.icon className="h-4 w-4 flex-shrink-0" />}
            <span className="truncate flex-1 text-left">
              {tab.title || tab.path.split('/').pop() || 'Sin título'}
            </span>
            {canClose && (
              <div
                onClick={(e) => onCloseTab(e, tab.id)}
                className={cn(
                  'flex-shrink-0 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-0.5 transition-opacity',
                  isActive && 'opacity-100'
                )}
                aria-label="Cerrar pestaña"
              >
                <X className="h-3 w-3" />
              </div>
            )}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </Button>
        </TooltipWrapper>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onCloseTab({} as React.MouseEvent, tab.id)}>
          Cerrar
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCloseOthers(tab.id)}>
          Cerrar otras pestañas
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCloseAll()}>
          Cerrar todas las pestañas
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

TabItem.displayName = 'TabItem';

const TabBar: React.FC<TabBarProps> = ({ className }) => {
  const navigate = useNavigate();

  // Usar selectores específicos para evitar re-renders
  const tabs = useTabStore(state => state.tabs);
  const activeTabId = useTabStore(state => state.activeTabId);
  const setActiveTab = useTabStore(state => state.setActiveTab);
  const removeTab = useTabStore(state => state.removeTab);
  const closeOtherTabs = useTabStore(state => state.closeOtherTabs);
  const closeAllTabs = useTabStore(state => state.closeAllTabs);

  const handleTabClick = useCallback((tab: Tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  }, [setActiveTab, navigate]);

  const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);

    // Si no quedan tabs, navegar al dashboard
    const remainingTabs = tabs.filter(t => t.id !== tabId);
    if (remainingTabs.length === 0) {
      navigate('/dashboard');
    }
  }, [removeTab, tabs, navigate]);

  const handleNewTab = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleCloseOthers = useCallback((tabId: string) => {
    closeOtherTabs(tabId);
  }, [closeOtherTabs]);

  const handleCloseAll = useCallback(() => {
    closeAllTabs();
    navigate('/dashboard');
  }, [closeAllTabs, navigate]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <Tabs.Root
      value={activeTabId || undefined}
      onValueChange={setActiveTab}
      className={cn('flex items-center border-b border-gray-200 bg-white', className)}
    >
      <ScrollArea className="flex-1">
        <Tabs.List className="flex items-center gap-1 px-2 py-1">
          {tabs.map((tab) => (
            <Tabs.Trigger key={tab.id} value={tab.id} asChild>
              <TabItem
                tab={tab}
                isActive={tab.id === activeTabId}
                onTabClick={handleTabClick}
                onCloseTab={handleCloseTab}
                onCloseOthers={handleCloseOthers}
                onCloseAll={handleCloseAll}
                canClose={tabs.length > 1}
              /> 
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div className="flex-shrink-0 border-l border-gray-200 px-2">
        <TooltipWrapper tooltip="Nueva pestaña (Ctrl+T)">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewTab}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipWrapper>
      </div>
    </Tabs.Root>
  );
};

export default React.memo(TabBar);
