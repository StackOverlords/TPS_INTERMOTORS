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
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, X } from 'lucide-react';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';

interface TabBarProps {
  className?: string;
  onCloseTab?: (tabId: string) => void; // Función externa para cerrar tabs (con lógica de navegación)
}

// Memoizar componente de tab individual con drag & drop
const TabItem = React.memo(
  ({
    tab,
    isActive,
    onTabClick,
    onCloseTab,
    onCloseOthers,
    onCloseAll,
    canClose,
  }: {
    tab: Tab;
    isActive: boolean;
    onTabClick: (tab: Tab) => void;
    onCloseTab: (e: React.MouseEvent, tabId: string) => void;
    onCloseOthers: (tabId: string) => void;
    onCloseAll: () => void;
    canClose: boolean;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: tab.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // Mostrar título completo + ruta en el tooltip
    const tooltipContent = (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{tab.title}</span>
        <span className="text-xs text-gray-400">{tab.path}</span>
      </div>
    );

    return (
      <div ref={setNodeRef} style={style}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {/* <TooltipWrapper tooltip={tooltipContent}> */}
            <Button
              variant="ghost"
              onClick={() => onTabClick(tab)}
              {...attributes}
              {...listeners}
              className={cn(
                'group relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                'hover:bg-gray-100',
                'min-w-[120px] max-w-[200px]',
                'cursor-grab active:cursor-grabbing',
                isDragging && 'shadow-lg ring-2 ring-primary/20',
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
                <span
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCloseTab(e, tab.id);
                  }}
                  onMouseDown={e => {
                    e.stopPropagation();
                  }}
                  className={cn(
                    'flex-shrink-0 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-0.5 transition-opacity cursor-pointer',
                    isActive && 'opacity-100'
                  )}
                  aria-label="Cerrar pestaña"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => onCloseTab({} as React.MouseEvent, tab.id)}
            >
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
      </div>
    );
  }
);

TabItem.displayName = 'TabItem';

const TabBar: React.FC<TabBarProps> = ({
  className,
  onCloseTab: externalOnCloseTab,
}) => {
  const navigate = useNavigate();

  // Usar selectores específicos para evitar re-renders
  const tabs = useTabStore(state => state.tabs);
  const activeTabId = useTabStore(state => state.activeTabId);
  const setActiveTab = useTabStore(state => state.setActiveTab);
  const reorderTabs = useTabStore(state => state.reorderTabs);
  const closeOtherTabs = useTabStore(state => state.closeOtherTabs);
  const closeAllTabs = useTabStore(state => state.closeAllTabs);

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requerir 8px de movimiento antes de iniciar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = tabs.findIndex(tab => tab.id === active.id);
        const newIndex = tabs.findIndex(tab => tab.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          reorderTabs(oldIndex, newIndex);
        }
      }
    },
    [tabs, reorderTabs]
  );

  const handleTabClick = useCallback(
    (tab: Tab) => {
      setActiveTab(tab.id);
      navigate(tab.path);
    },
    [setActiveTab, navigate]
  );

  const handleCloseTab = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();

      // Si hay una función externa, usarla (viene del layout con la lógica correcta)
      if (externalOnCloseTab) {
        // Primero activar la tab que vamos a cerrar para que closeCurrentTab funcione
        if (tabId !== activeTabId) {
          setActiveTab(tabId);
          // Esperar un tick para que el store se actualice
          setTimeout(() => {
            externalOnCloseTab(tabId);
          }, 0);
        } else {
          externalOnCloseTab(tabId);
        }
      }
    },
    [externalOnCloseTab, activeTabId, setActiveTab]
  );

  const handleNewTab = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleCloseOthers = useCallback(
    (tabId: string) => {
      closeOtherTabs(tabId);
    },
    [closeOtherTabs]
  );

  const handleCloseAll = useCallback(() => {
    closeAllTabs();
    navigate('/dashboard');
  }, [closeAllTabs, navigate]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
    >
      <Tabs.Root
        value={activeTabId || undefined}
        onValueChange={setActiveTab}
        className={cn(
          'flex items-center border-b border-gray-200 bg-white',
          className
        )}
      >
        <ScrollArea className="flex-1">
          <SortableContext
            items={tabs.map(tab => tab.id)}
            strategy={horizontalListSortingStrategy}
          >
            <Tabs.List className="flex items-center gap-1 px-2 py-1">
              {tabs.map(tab => (
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
          </SortableContext>
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
    </DndContext>
  );
};

export default React.memo(TabBar);
