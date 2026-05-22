import {
  PanelRight,
  Maximize2,
  MessagesSquare,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { useChatUIStore } from "../stores/ChatUiStore";
import { selectTotalUnread, useChatStore } from "../stores/ChatStore";
import { useLocation } from "react-router";

export function ChatTopbarButton() {
  const { open } = useChatUIStore();
  const totalUnread = useChatStore(selectTotalUnread);
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  if (location.pathname === "/dashboard/chat") return null;

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  };

  return (
    <div className="relative">
      {/* Botón real — click izquierdo abre el chat */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative"
            aria-label="Chat interno"
            onClick={() => open("floating")}
            onContextMenu={onContextMenu}
          >
            <MessagesSquare className="h-4 w-4" />
            {totalUnread > 0 && (
              <Badge
                variant={"destructive"}
                className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center border-2 border-background px-1 text-[9px]"
              >
                {totalUnread > 99 ? "99+" : totalUnread}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Clic para abrir · clic derecho para más opciones
        </TooltipContent>
      </Tooltip>

      {/* Trigger invisible solo para anclar el DropdownMenu */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div
            ref={anchorRef}
            className="absolute inset-0 pointer-events-none"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs">
            Chat interno
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => open("floating")}>
            <Maximize2 className="mr-2 h-4 w-4" />
            Ventana flotante
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => open("side")}>
            <PanelRight className="mr-2 h-4 w-4" />
            Panel lateral
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
