import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_FLOATING_SIZE } from "../stores/ChatUiStore";
import {
  Maximize2,
  Minimize2,
  X,
  PanelRight,
  Loader2,
  MessagesSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { cn } from "@/lib/utils";
import { useChats } from "../hooks/useChats";
import { ConversationList } from "./ConversationList";
import { ChatConversation } from "./ChatConversation";
import { useChatUIStore } from "../stores/ChatUiStore";
import { selectTotalUnread, useChatStore } from "../stores/ChatStore";

const MIN_W = 340;
const MIN_H = 420;
const MAX_W = 640;
const MAX_H = 860;

export function ChatFloatingWindow() {
  const {
    isOpen,
    viewMode,
    floatingPos,
    floatingSize,
    close,
    setViewMode,
    setFloatingPos,
    setFloatingSize,
    isMaximized,
    setIsMaximized,
    preMaximizeLayout,
    setPreMaximizeLayout,
  } = useChatUIStore();

  const pendingDirectChat = useChatStore((s) => s.pendingDirectChat);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const totalUnread = useChatStore(selectTotalUnread);
  const { isLoading: isLoadingChats } = useChats();

  const [isDragging, setIsDragging] = useState(false);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Two-column layout follows maximize state
  const isTwoColumn = isMaximized;

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      e.preventDefault();
      dragOffsetRef.current = {
        x: e.clientX - floatingPos.x,
        y: e.clientY - floatingPos.y,
      };
      setIsDragging(true);
    },
    [floatingPos, isMaximized]
  );

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = "none";
    const onMove = (e: MouseEvent) => {
      const x = Math.max(
        0,
        Math.min(
          window.innerWidth - floatingSize.w,
          e.clientX - dragOffsetRef.current.x
        )
      );
      const y = Math.max(
        0,
        Math.min(window.innerHeight - 40, e.clientY - dragOffsetRef.current.y)
      );
      setFloatingPos({ x, y });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, floatingSize.w, setFloatingPos]);

  // ── Resize ─────────────────────────────────────────────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.style.userSelect = "none";
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = floatingSize.w;
      const startH = floatingSize.h;
      const onMove = (ev: MouseEvent) => {
        const newW = Math.max(
          MIN_W,
          Math.min(MAX_W, startW + (ev.clientX - startX))
        );
        const newH = Math.max(
          MIN_H,
          Math.min(MAX_H, startH + (ev.clientY - startY))
        );
        setFloatingSize({ w: newW, h: newH });
      };
      const onUp = () => {
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [floatingSize, setFloatingSize]
  );

  // ── Maximize toggle ────────────────────────────────────────────────────────
  const toggleMaximize = () => {
    if (isMaximized) {
      const restoreSize = preMaximizeLayout?.size ?? DEFAULT_FLOATING_SIZE;
      const restorePos = preMaximizeLayout?.pos ?? {
        x: window.innerWidth - restoreSize.w - 24,
        y: window.innerHeight - restoreSize.h - 24,
      };
      setFloatingPos(restorePos);
      setFloatingSize(restoreSize);
      setPreMaximizeLayout(null);
      setIsMaximized(false);
    } else {
      setPreMaximizeLayout({ pos: floatingPos, size: floatingSize });
      setFloatingPos({ x: 60, y: 20 });
      setFloatingSize({
        w: window.innerWidth - 120,
        h: window.innerHeight - 80,
      });
      setIsMaximized(true);
    }
  };

  if (!isOpen || viewMode !== "floating") return null;

  return (
    <motion.div
      ref={windowRef}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "fixed z-[60] flex flex-col overflow-hidden rounded-xl border border-border/50 bg-background shadow-2xl",
        isDragging && "cursor-grabbing select-none"
      )}
      style={{
        left: floatingPos.x,
        top: floatingPos.y,
        width: floatingSize.w,
        height: floatingSize.h,
      }}
    >
      {/* Title bar — draggable */}
      <div
        onMouseDown={handleDragStart}
        className="flex shrink-0 cursor-grab items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-1.5 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <MessagesSquare className="size-5 text-primary" />
          <span className="text-sm font-semibold">Chat interno</span>
          {totalUnread > 0 && (
            <Badge className="h-4 min-w-4 border-0 bg-primary px-1 text-[10px] text-primary-foreground items-center justify-center">
              {totalUnread}
            </Badge>
          )}
          {isLoadingChats && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("side")}
              >
                <PanelRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Panel lateral</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" onClick={toggleMaximize}>
            {isMaximized ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-destructive"
            onClick={close}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {isTwoColumn ? (
          /*
           * Layout de dos columnas (≥ 520 px de ancho):
           * sidebar fijo con la lista + panel principal con la conversación,
           * exactamente igual a ChatScreen.
           */
          <div className="flex h-full overflow-hidden">
            <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-border/50">
              <ConversationList />
            </aside>
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {activeChatId || pendingDirectChat ? (
                <ChatConversation compact={false} showBackButton />
              ) : (
                <EmptyConversationPlaceholder />
              )}
            </main>
          </div>
        ) : (
          /*
           * Layout de una sola columna (< 520 px):
           * comportamiento original — lista o conversación, nunca ambas.
           */
          <>
            {activeChatId || pendingDirectChat ? (
              <ChatConversation showBackButton />
            ) : (
              <ConversationList />
            )}
          </>
        )}
      </div>

      {/* Resize handle */}
      {!isMaximized && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, hsl(var(--border)) 50%)",
          }}
        />
      )}
    </motion.div>
  );
}

/** Placeholder cuando hay ancho para dos columnas pero no hay chat activo. */
function EmptyConversationPlaceholder() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-muted/30">
        <MessagesSquare className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="font-medium text-muted-foreground">
          Selecciona una conversación
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground/60">
          Elige un chat de la lista o crea uno nuevo
        </p>
      </div>
    </div>
  );
}
