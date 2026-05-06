import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Minus,
  Maximize2,
  Minimize2,
  X,
  PanelRight,
  Loader2,
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
    isMinimized,
    viewMode,
    floatingPos,
    floatingSize,
    toggleMinimize,
    close,
    setViewMode,
    setFloatingPos,
    setFloatingSize,
  } = useChatUIStore();

  const activeChatId = useChatStore((s) => s.activeChatId);
  const totalUnread = useChatStore(selectTotalUnread);
  const { isLoading: isLoadingChats } = useChats();

  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevLayout, setPrevLayout] = useState<{
    pos: typeof floatingPos;
    size: typeof floatingSize;
  } | null>(null);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
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
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, floatingSize.w, setFloatingPos]);

  // ── Resize ─────────────────────────────────────────────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
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
      if (prevLayout) {
        setFloatingPos(prevLayout.pos);
        setFloatingSize(prevLayout.size);
      }
      setIsMaximized(false);
    } else {
      setPrevLayout({ pos: floatingPos, size: floatingSize });
      setFloatingPos({ x: 60, y: 20 });
      setFloatingSize({
        w: window.innerWidth - 120,
        h: window.innerHeight - 80,
      });
      setIsMaximized(true);
    }
  };

  if (!isOpen || viewMode !== "floating") return null;

  // ── Minimized pill ─────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed z-[60]"
        style={{ left: floatingPos.x, top: floatingPos.y }}
      >
        <button
          onClick={toggleMinimize}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-shadow hover:shadow-xl"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
          {totalUnread > 0 && (
            <Badge className="h-5 min-w-5 border-0 bg-destructive px-1 text-[10px] text-destructive-foreground">
              {totalUnread}
            </Badge>
          )}
        </button>
      </motion.div>
    );
  }

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
          <MessageCircle className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Chat interno</span>
          {totalUnread > 0 && (
            <Badge className="h-4 min-w-4 border-0 bg-primary px-1 text-[10px] text-primary-foreground">
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
                className="h-6 w-6"
                onClick={() => setViewMode("side")}
              >
                <PanelRight className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Panel lateral</TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleMinimize}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleMaximize}
          >
            {isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-destructive"
            onClick={close}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content — min-h-0 + flex-1 so messages scroll, not the window */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {!activeChatId ? (
          <ConversationList />
        ) : (
          <ChatConversation showBackButton />
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
