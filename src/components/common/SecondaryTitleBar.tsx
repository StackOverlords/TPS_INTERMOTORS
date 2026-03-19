import { Button } from "@/components/atoms/button";
import { Separator } from "@/components/atoms/separator";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

const appWindow = getCurrentWebviewWindow();

const SecondaryTitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  const title = new URLSearchParams(window.location.search).get("windowTitle") ?? "";

  useEffect(() => {
    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });
    return () => { unlisten.then((f) => f()); };
  }, []);

  const handleMouseDown = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.button === 0) {
      e.preventDefault();
      await appWindow.startDragging();
    }
  };

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

  return (
    <div
      onMouseDown={handleMouseDown}
      className="bg-background border-b border-border flex items-center justify-between flex-shrink-0 select-none z-50 py-1 px-2"
    >
      <div className="flex items-center gap-2 h-8">
        <span className="font-black uppercase text-xs">Intermotors</span>
        {title && (
          <>
            <Separator orientation="vertical" />
            <span className="text-xs text-muted-foreground">{title}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" className="size-8" onClick={handleMinimize}>
          <Minus className="size-3 text-foreground" />
        </Button>

        <Button type="button" variant="ghost" className="size-8" onClick={handleMaximize}>
          {isMaximized
            ? <Copy className="size-3 text-foreground rotate-270" />
            : <Square className="size-3 text-foreground" />
          }
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="size-8 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={handleClose}
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
  );
};

export default SecondaryTitleBar;
