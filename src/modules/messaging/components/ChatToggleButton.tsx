import { useCallback, useEffect, useRef, useState } from "react";
import { MessagesSquare, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/atoms/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { useChatUIStore } from "../stores/ChatUiStore";
import { selectTotalUnread, useChatStore } from "../stores/ChatStore";
import { useLocation } from "react-router";

const SIZE = 48;
const DRAG_THRESHOLD = 4;

interface Pos {
  x: number;
  y: number;
}

function clamp(p: Pos): Pos {
  return {
    x: Math.min(Math.max(8, p.x), window.innerWidth - SIZE - 8),
    y: Math.min(Math.max(8, p.y), window.innerHeight - SIZE - 8),
  };
}

export function ChatToggleButton() {
  const { isOpen, fabHidden, open, setFabHidden } = useChatUIStore();
  const totalUnread = useChatStore(selectTotalUnread);
  const location = useLocation();
  const isOnChatPage = location.pathname === "/dashboard/chat";

  const [pos, setPos] = useState<Pos>(() =>
    clamp({
      x: window.innerWidth - SIZE - 24,
      y: window.innerHeight - SIZE - 24,
    })
  );
  const [dragging, setDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  // Clamp on window resize
  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Drag logic
  useEffect(() => {
    if (!dragging) return;
    const d = dragRef.current;
    if (!d) return;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
      setPos(clamp({ x: d.origX + dx, y: d.origY + dy }));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
        moved: false,
      };
      setDragging(true);
    },
    [pos]
  );

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current?.moved) return;
    open("floating");
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  };

  const shouldHide = isOpen || fabHidden || isOnChatPage;

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div
          key="chat-fab"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          style={{ left: pos.x, top: pos.y }}
          className="fixed z-40"
        >
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    type="button"
                    whileHover={{ scale: dragging ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onPointerDown={(e) => {
                      if (e.button === 0) e.preventDefault();
                    }}
                    onMouseDown={onMouseDown}
                    onClick={onClick}
                    onContextMenu={onContextMenu}
                    style={{
                      cursor: dragging ? "grabbing" : "grab",
                      touchAction: "none",
                      WebkitTapHighlightColor: "transparent",
                    }}
                    className="relative flex h-12 w-12 select-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow hover:shadow-xl"
                  >
                    <MessagesSquare className="pointer-events-none h-5 w-5" />
                    <AnimatePresence>
                      {totalUnread > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="pointer-events-none absolute -right-1 -top-1"
                        >
                          <Badge className="h-5 min-w-5 border-2 border-background bg-destructive px-1 text-[10px] text-destructive-foreground">
                            {totalUnread > 99 ? "99+" : totalUnread}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="left">
                Clic para abrir · arrastra para mover · clic derecho para más
                opciones
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" side="top" className="w-44">
              <DropdownMenuItem
                onClick={() => {
                  setMenuOpen(false);
                  setFabHidden(true);
                }}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Ocultar burbuja
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
