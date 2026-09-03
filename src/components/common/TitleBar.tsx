import { Minus, Square, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getWindowChrome } from "@/platform";
import TabBar from "../tabs/TabBar";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useCommands } from "@/keybindings";
import { Button } from "../atoms/button";
import { useShowTabBar } from "@/hooks/tabs/useShowTabBar";
import { Separator } from "../atoms/separator";
import { flushTabStorage } from "@/states/tabStore";

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const chrome = getWindowChrome();

  // En web el marco de la ventana lo dibuja el navegador: la barra sigue
  // mostrando marca y pestañas, pero sin controles de ventana.
  const showWindowControls = chrome.hasCustomChrome();

  const { shouldShowTabBar } = useShowTabBar();

  useEffect(() => {
    if (!showWindowControls) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;

    chrome
      .onMaximizeChange(setIsMaximized)
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch(() => {});

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [chrome, showWindowControls]);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await chrome.minimize();
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await chrome.toggleMaximize();
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // ✅ Forzar guardado inmediato antes de cerrar
    flushTabStorage();
    await chrome.close();
  };

  const handleDragAreaClick = async (e: React.MouseEvent) => {
    if (!showWindowControls) return;

    const target = e.target as HTMLElement;

    // Prevenir drag en elementos interactivos
    if (target.closest("button")) return;
    if (target.closest("a")) return;
    if (target.closest("[role='tab']")) return;
    if (target.closest("[data-radix-scroll-area-viewport]")) return;

    // Prevenir drag en menús de Radix UI (ContextMenu y DropdownMenu)
    if (target.closest("[role='menu']")) return;
    if (target.closest("[role='menuitem']")) return;
    if (target.closest("[data-radix-popper-content-wrapper]")) return;
    if (target.closest("[data-radix-context-menu-content]")) return;
    if (target.closest("[data-radix-dropdown-menu-content]")) return;

    // Áreas específicas para drag
    if (
      target.hasAttribute("data-drag-container-tabbar") ||
      target.hasAttribute("data-drag-area-tabbar")
    ) {
      if (e.button === 0) {
        e.preventDefault();
        await chrome.startDragging();
      }
      return;
    }

    // Drag general en el resto de la barra
    if (e.button === 0) {
      e.preventDefault();
      await chrome.startDragging();
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
        <span className="font-black uppercase text-xs flex-shrink-0">
          Intermotors
        </span>
        <Separator orientation="vertical" />
        {shouldShowTabBar && (
          <div data-tabbar-container className="flex-1 min-w-0 overflow-x-auto">
            <TabBar onCloseTab={closeCurrentTab} alwaysVisible={true} />
          </div>
        )}
      </div>

      {showWindowControls && (
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
      )}
    </div>
  );
};

export default TitleBar;
