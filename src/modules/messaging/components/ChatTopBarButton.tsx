import {
  Eye,
  EyeOff,
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

export function ChatTopbarButton() {
  const { open, fabHidden, setFabHidden } = useChatUIStore();
  const totalUnread = useChatStore(selectTotalUnread);
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

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
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center border-2 border-background bg-destructive px-1 text-[9px] text-destructive-foreground">
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

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
            Burbuja flotante
          </DropdownMenuLabel>

          {fabHidden ? (
            <DropdownMenuItem onClick={() => setFabHidden(false)}>
              <Eye className="mr-2 h-4 w-4" />
              Mostrar burbuja
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setFabHidden(true)}>
              <EyeOff className="mr-2 h-4 w-4" />
              Ocultar burbuja
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
