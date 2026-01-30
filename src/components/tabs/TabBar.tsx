import { Button } from '@/components/atoms/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/atoms/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/atoms/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/atoms/scroll-area';
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
import { X, ChevronDown, Check } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCommand } from '@/keybindings';

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
    // const tooltipContent = (
    //   <div className="flex flex-col gap-1">
    //     <span className="font-medium">{tab.title}</span>
    //     <span className="text-xs text-gray-400">{tab.path}</span>
    //   </div>
    // );

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
                'group relative flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-colors',
                'hover:bg-accent',
                'min-w-[120px] max-w-[200px] h-7',
                'cursor-grab active:cursor-grabbing',
                isDragging && 'shadow-lg ring-2 ring-primary/20',
                isActive
                  ? 'bg-accent text-primary'
                  : 'text-foreground hover:text-primary'
              )}
            >
              {tab.icon && <tab.icon className="size-3 flex-shrink-0" />}
              <span className="truncate flex-1 text-left" title={tab.title}>
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
                    'flex-shrink-0 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-border p-0.5 transition-opacity cursor-pointer',
                    isActive && 'opacity-100'
                  )}
                  aria-label="Cerrar pestaña"
                >
                  <X className="size-3" />
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent className='border-none'>
            {/* <ContextMenuItem
              onClick={() => onCloseTab({} as React.MouseEvent, tab.id)}
            >
              Cerrar
            </ContextMenuItem> */}
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

  // Estado para controlar el dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ✅ Optimizado: Selectores específicos con comparación shallow
  const tabs = useTabStore(state => state.tabs);
  const activeTabId = useTabStore(state => state.activeTabId);
  const setActiveTab = useTabStore(state => state.setActiveTab);
  const reorderTabs = useTabStore(state => state.reorderTabs);
  const closeOtherTabs = useTabStore(state => state.closeOtherTabs);
  const closeAllTabs = useTabStore(state => state.closeAllTabs);

  // Keybinding para Ctrl+T - abrir/cerrar menú de tabs
  useCommand('tabs.toggleMenu', () => {
    setIsDropdownOpen(prev => !prev);
  }, {
    enableOnFormTags: true,
    preventDefault: true,
  });

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

      // Si hay una función externa, usarla directamente
      // La lógica de navegación ya está en closeCurrentTab
      if (externalOnCloseTab) {
        externalOnCloseTab(tabId);
      }
    },
    [externalOnCloseTab]
  );

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
          'flex items-center border-b border-border bg-background',
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
        <div className="flex-shrink-0 border-l border-border px-2">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 hover:bg-accent"
              >
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Pestañas abiertas ({tabs.length})
              </div>
              <DropdownMenuSeparator />
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    "hover:bg-accent focus:bg-accent",
                    tab.id === activeTabId && "bg-primary/10 text-primary hover:bg-primary/15 focus:bg-primary/20"
                  )}
                >
                  {tab.icon && <tab.icon className="size-3 flex-shrink-0" />}
                  <span className="flex-1 truncate text-xs">
                    {tab.title || tab.path.split('/').pop() || 'Sin título'}
                  </span>
                  {tab.id === activeTabId && (
                    <Check className="size-3 text-primary flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Tabs.Root>
    </DndContext>
  );
};

export default React.memo(TabBar);
