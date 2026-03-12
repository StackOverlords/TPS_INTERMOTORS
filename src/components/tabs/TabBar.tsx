import { Button } from "@/components/atoms/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/atoms/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/atoms/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/atoms/scroll-area";
import { cn } from "@/lib/utils";
import { useTabStore, type Tab } from "@/states/tabStore";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Tabs from "@radix-ui/react-tabs";
import { X, ChevronDown, Check, Plus, Pin, PinOff } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useCommand } from "@/keybindings";

interface TabBarProps {
  className?: string;
  onCloseTab?: (tabId: string) => void;
  alwaysVisible?: boolean;
}

// ─── Pinned Tab Item ──────────────────────────────────────────────────────────

const PinnedTabItem = React.memo(
  ({
    tab,
    isActive,
    onTabClick,
    onUnpin,
    onCloseOthers,
    onCloseAll,
  }: {
    tab: Tab;
    isActive: boolean;
    onTabClick: (tab: Tab) => void;
    onUnpin: (tabId: string) => void;
    onCloseOthers: (tabId: string) => void;
    onCloseAll: () => void;
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

    return (
      <div ref={setNodeRef} style={style}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => onTabClick(tab)}
              {...attributes}
              {...listeners}
              title={tab.title}
              className={cn(
                "group relative flex items-center justify-center px-0 rounded-md transition-colors",
                "hover:bg-accent",
                "w-8 h-7 flex-shrink-0",
                "cursor-grab active:cursor-grabbing",
                isDragging && "shadow-lg ring-2 ring-primary/20",
                isActive
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon ? (
                <tab.icon className="size-3.5 flex-shrink-0" />
              ) : (
                <span className="text-xs font-semibold leading-none">
                  {(tab.title || "?").charAt(0).toUpperCase()}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent className="border-none">
            <ContextMenuItem onClick={() => onUnpin(tab.id)}>
              <PinOff className="size-3 mr-2" />
              Desanclar pestaña
            </ContextMenuItem>
            <ContextMenuSeparator />
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

PinnedTabItem.displayName = "PinnedTabItem";

// ─── Regular Tab Item ─────────────────────────────────────────────────────────

const TabItem = React.memo(
  ({
    tab,
    isActive,
    onTabClick,
    onCloseTab,
    onPin,
    onCloseOthers,
    onCloseAll,
    canClose,
  }: {
    tab: Tab;
    isActive: boolean;
    onTabClick: (tab: Tab) => void;
    onCloseTab: (e: React.MouseEvent, tabId: string) => void;
    onPin: (tabId: string) => void;
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

    return (
      <div ref={setNodeRef} style={style}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => onTabClick(tab)}
              {...attributes}
              {...listeners}
              className={cn(
                "group relative flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-colors",
                "hover:bg-accent",
                "min-w-[120px] max-w-[200px] h-7",
                "cursor-grab active:cursor-grabbing",
                isDragging && "shadow-lg ring-2 ring-primary/20",
                isActive
                  ? "bg-accent text-primary"
                  : "text-foreground hover:text-primary"
              )}
            >
              {tab.icon && <tab.icon className="size-3 flex-shrink-0" />}
              <span className="truncate flex-1 text-left" title={tab.title}>
                {tab.title || tab.path.split("/").pop() || "Sin título"}
              </span>
              {canClose && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCloseTab(e, tab.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  className={cn(
                    "flex-shrink-0 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-border p-0.5 transition-opacity cursor-pointer",
                    isActive && "opacity-100"
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
          <ContextMenuContent className="border-none">
            <ContextMenuItem onClick={() => onPin(tab.id)}>
              <Pin className="size-3 mr-2" />
              Anclar pestaña
            </ContextMenuItem>
            <ContextMenuSeparator />
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

TabItem.displayName = "TabItem";

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyTabBar = React.memo(({ onNewTab }: { onNewTab: () => void }) => {
  return (
    <div className="flex items-center h-8 px-2 gap-2">
      <span className="text-xs text-muted-foreground">
        No hay pestañas abiertas
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNewTab}
        className="h-6 px-2 text-xs hover:bg-accent"
      >
        <Plus className="size-3 mr-1" />
        Nueva pestaña
      </Button>
    </div>
  );
});

EmptyTabBar.displayName = "EmptyTabBar";

// ─── TabBar ───────────────────────────────────────────────────────────────────

const TabBar: React.FC<TabBarProps> = ({
  className,
  onCloseTab: externalOnCloseTab,
  alwaysVisible = false,
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const reorderTabs = useTabStore((state) => state.reorderTabs);
  const closeOtherTabs = useTabStore((state) => state.closeOtherTabs);
  const closeAllTabs = useTabStore((state) => state.closeAllTabs);
  const pinTab = useTabStore((state) => state.pinTab);
  const unpinTab = useTabStore((state) => state.unpinTab);

  const pinnedTabs = useMemo(() => tabs.filter((t) => t.pinned), [tabs]);
  const regularTabs = useMemo(() => tabs.filter((t) => !t.pinned), [tabs]);

  useCommand(
    "tabs.toggleMenu",
    () => {
      setIsDropdownOpen((prev) => !prev);
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeTab = tabs.find((t) => t.id === active.id);
      const overTab = tabs.find((t) => t.id === over.id);

      // No permitir mover tabs entre grupos (pinned ↔ regular)
      if (!activeTab || !overTab) return;
      if (!!activeTab.pinned !== !!overTab.pinned) return;

      const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
      const newIndex = tabs.findIndex((tab) => tab.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTabs(oldIndex, newIndex);
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
    navigate("/dashboard");
  }, [closeAllTabs, navigate]);

  const handleNewTab = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  if (tabs.length === 0 && !alwaysVisible) {
    return null;
  }

  if (tabs.length === 0) {
    return <EmptyTabBar onNewTab={handleNewTab} />;
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
        className={cn("flex items-center bg-background w-full", className)}
      >
        {/* ── Pinned tabs (siempre visibles, sin scroll) ── */}
        {pinnedTabs.length > 0 && (
          <div className="flex items-center flex-shrink-0 pl-2">
            <SortableContext
              items={pinnedTabs.map((t) => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              <Tabs.List className="flex items-center gap-1 py-1">
                {pinnedTabs.map((tab) => (
                  <Tabs.Trigger key={tab.id} value={tab.id} asChild>
                    <PinnedTabItem
                      tab={tab}
                      isActive={tab.id === activeTabId}
                      onTabClick={handleTabClick}
                      onUnpin={unpinTab}
                      onCloseOthers={handleCloseOthers}
                      onCloseAll={handleCloseAll}
                    />
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </SortableContext>
            {/* Separador visual entre pinned y regular */}
            <div className="w-px h-4 bg-border mx-2 flex-shrink-0" />
          </div>
        )}

        {/* ── Regular tabs (scrollables) ── */}
        <div data-drag-container-tabbar className="flex-1 overflow-hidden min-w-0">
          <ScrollArea className="w-max max-w-full">
            <SortableContext
              items={regularTabs.map((tab) => tab.id)}
              strategy={horizontalListSortingStrategy}
            >
              <Tabs.List className="flex items-center gap-1 px-2 py-1">
                {regularTabs.map((tab) => (
                  <Tabs.Trigger key={tab.id} value={tab.id} asChild>
                    <TabItem
                      tab={tab}
                      isActive={tab.id === activeTabId}
                      onTabClick={handleTabClick}
                      onCloseTab={handleCloseTab}
                      onPin={pinTab}
                      onCloseOthers={handleCloseOthers}
                      onCloseAll={handleCloseAll}
                      canClose={regularTabs.length > 1 || pinnedTabs.length > 0}
                    />
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </SortableContext>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* ── Overflow dropdown ── */}
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
            <DropdownMenuContent
              align="end"
              className="w-64 max-h-96 overflow-y-auto"
            >
              {pinnedTabs.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Pin className="size-3" />
                    Ancladas ({pinnedTabs.length})
                  </div>
                  {pinnedTabs.map((tab) => (
                    <DropdownMenuItem
                      key={tab.id}
                      onClick={() => handleTabClick(tab)}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        "hover:bg-accent focus:bg-accent",
                        tab.id === activeTabId &&
                          "bg-primary/10 text-primary hover:bg-primary/15 focus:bg-primary/20"
                      )}
                    >
                      {tab.icon ? (
                        <tab.icon className="size-3 flex-shrink-0" />
                      ) : (
                        <span className="size-3 flex-shrink-0 text-center text-xs font-semibold leading-none">
                          {(tab.title || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="flex-1 truncate text-xs">{tab.title}</span>
                      {tab.id === activeTabId && (
                        <Check className="size-3 text-primary flex-shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Pestañas ({regularTabs.length})
                  </div>
                </>
              )}
              {!pinnedTabs.length && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Pestañas abiertas ({regularTabs.length})
                </div>
              )}
              {regularTabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    "hover:bg-accent focus:bg-accent",
                    tab.id === activeTabId &&
                      "bg-primary/10 text-primary hover:bg-primary/15 focus:bg-primary/20"
                  )}
                >
                  {tab.icon && <tab.icon className="size-3 flex-shrink-0" />}
                  <span className="flex-1 truncate text-xs">
                    {tab.title || tab.path.split("/").pop() || "Sin título"}
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
