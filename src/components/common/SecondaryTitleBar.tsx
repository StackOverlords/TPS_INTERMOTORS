import { Button } from "@/components/atoms/button";
import { Separator } from "@/components/atoms/separator";
import { getWindowChrome } from "@/platform";
import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

const SecondaryTitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const chrome = getWindowChrome();

  // En web el marco lo dibuja el navegador, así que minimizar/maximizar no
  // aplican. Cerrar SÍ funciona: son ventanas abiertas por script.
  const showWindowControls = chrome.hasCustomChrome();

  const title = new URLSearchParams(window.location.search).get("windowTitle") ?? "";

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

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (!showWindowControls) return;
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.button === 0) {
      e.preventDefault();
      await chrome.startDragging();
    }
  };

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
    await chrome.close();
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="bg-primary text-primary-foreground flex items-center justify-between flex-shrink-0 select-none z-50 py-1 px-2"
    >
      <div className="flex items-center gap-2 h-8">
        <span className="font-black uppercase text-xs">Intermotors</span>
        {title && (
          <>
            <Separator orientation="vertical" className="bg-primary-foreground/30" />
            <span className="text-xs text-primary-foreground/70">{title}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        {showWindowControls && (
          <>
            <Button
              type="button"
              variant="ghost"
              className="size-8 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={handleMinimize}
            >
              <Minus className="size-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="size-8 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={handleMaximize}
            >
              {isMaximized
                ? <Copy className="size-3 rotate-270" />
                : <Square className="size-3" />
              }
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="ghost"
          className="size-8 text-primary-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={handleClose}
        >
          <X className="size-3" />
        </Button>
      </div>
    </div>
  );
};

export default SecondaryTitleBar;
