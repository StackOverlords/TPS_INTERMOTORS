import { Minus, Square, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import TabBar from "../tabs/TabBar";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useCommands } from "@/keybindings";
import { Button } from "../atoms/button";
import { useShowTabBar } from "@/hooks/tabs/useShowTabBar";
import { Separator } from "../atoms/separator";

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  const { shouldShowTabBar } = useShowTabBar();

  useEffect(() => {
    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [appWindow]);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await appWindow.minimize();
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await appWindow.toggleMaximize();
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await appWindow.close();
  };

  const handleDragAreaClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Prevenir drag en elementos interactivos
    if (target.closest("button")) return;
    if (target.closest("a")) return;
    if (target.closest("[role='tab']")) return;
    if (target.closest("[data-radix-scroll-area-viewport]")) return;

    // Áreas específicas para drag
    if (
      target.hasAttribute("data-drag-container-tabbar") ||
      target.hasAttribute("data-drag-area-tabbar")
    ) {
      if (e.button === 0) {
        e.preventDefault();
        await appWindow.startDragging();
      }
      return;
    }

    // Drag general en el resto de la barra
    if (e.button === 0) {
      e.preventDefault();
      await appWindow.startDragging();
    }
  };

  const { nextTab, previousTab, closeCurrentTab } = useTabNavigation();

  // Comandos de teclado para navegación de tabs
  useCommands(
    {
      "tabs.next": nextTab,
      "tabs.previous": previousTab,
      "tabs.close": closeCurrentTab,
    },
    {
      enableOnFormTags: true,
    }
  );

  return (
    <div
      onMouseDown={handleDragAreaClick}
      className="bg-background border-b border-border flex items-center justify-between flex-shrink-0 z-50 relative py-1 px-2"
    >
      <div className="flex items-center flex-1 overflow-hidden gap-2 h-8">
        <span className="font-black uppercase text-xs text-primary flex-shrink-0">
          Intermotors
        </span>
        <Separator orientation="vertical" />
        {shouldShowTabBar && (
          <div data-tabbar-container className="flex-1 min-w-0 overflow-x-auto">
            <TabBar onCloseTab={closeCurrentTab} alwaysVisible={true} />
          </div>
        )}
      </div>

      <div className="flex items-center flex-shrink-0 gap-2">
        <div data-drag-area-tabbar className="h-8 w-3" />

        <Button
          type="button"
          onClick={handleMinimize}
          variant={"ghost"}
          className="size-8"
        >
          <Minus className="size-3 text-foreground" />
        </Button>

        <Button
          type="button"
          variant={"ghost"}
          className="size-8"
          onClick={handleMaximize}
        >
          {isMaximized ? (
            <Copy className="size-3 text-foreground rotate-270" />
          ) : (
            <Square className="size-3 text-foreground" />
          )}
        </Button>

        <Button
          type="button"
          variant={"ghost"}
          className="size-8 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={handleClose}
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
  );
};

export default TitleBar;
