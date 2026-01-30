import { Minus, Square, Copy, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [appWindow]);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await appWindow.minimize();
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await appWindow.toggleMaximize();
    // No hace falta setear el estado aquí porque el listener onResized lo hará por ti
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await appWindow.close();
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (e.button === 0) await appWindow.startDragging();
  };

  return (
    <div
      onMouseDown={handleDragStart}
      className="h-8 bg-card border-b border-border flex items-center justify-between px-3 select-none flex-shrink-0"
    >
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xs font-semibold text-foreground/80">Intermotors</span>
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={handleMinimize}
          className="h-8 w-11 flex items-center justify-center hover:bg-accent transition-colors"
        >
          <Minus className="h-3.5 w-3.5 text-foreground" />
        </button>

        <button
          type="button"
          onClick={handleMaximize}
          className="h-8 w-11 flex items-center justify-center hover:bg-accent transition-colors"
        >
          {isMaximized ? (
            <Copy className="h-3 w-3 text-foreground rotate-270" />
          ) : (
            <Square className="h-3 w-3 text-muted-foreground" />
          )}
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="h-8 w-11 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;