import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Check,
  CheckCheck,
  Reply,
  Copy,
  Forward,
  Trash2,
  ShoppingCart,
  Package,
  ArrowRightLeft,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Message, OptimisticMessage } from "../types/Message.types";
import { getInitials } from "../mocks/ChatMockUsers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import authSDK from "@/services/sdk-simple-auth";

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE BADGE — for business entity links
// ─────────────────────────────────────────────────────────────────────────────

function ReferenceBadge({ tipo, id }: { tipo: string; id: number }) {
  const icons: Record<string, React.ReactNode> = {
    sale: <ShoppingCart className="h-3 w-3" />,
    purchase: <Package className="h-3 w-3" />,
    transfer: <ArrowRightLeft className="h-3 w-3" />,
    almacen_out: <Package className="h-3 w-3" />,
    almacen_in: <Package className="h-3 w-3" />,
  };
  const labels: Record<string, string> = {
    sale: "Venta",
    purchase: "Compra",
    transfer: "Transferencia",
    almacen_out: "Salida almacén",
    almacen_in: "Entrada almacén",
  };

  return (
    <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
      <span className="text-primary">
        {icons[tipo] ?? <Package className="h-3 w-3" />}
      </span>
      <span className="text-[11px] font-semibold text-primary">
        {labels[tipo] ?? tipo} #{id}
      </span>
      {/* ⚠️ Aquí puedes agregar onClick para navegar al detalle del recurso */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS ICON for optimistic messages
// ─────────────────────────────────────────────────────────────────────────────

function MessageStatus({
  status,
}: {
  status: string | undefined;
  isMine: boolean;
}) {
  if (!status) return <CheckCheck className="h-3 w-3 text-blue-400" />;
  if (status === "sending") return <Check className="h-3 w-3 opacity-40" />;
  if (status === "queued")
    return <span className="text-[9px] opacity-60">cola</span>;
  if (status === "failed")
    return <span className="text-[9px] text-destructive">!</span>;
  return <CheckCheck className="h-3 w-3 text-blue-400" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  message: Message | OptimisticMessage;
  /** Previous message sender id — to group consecutive bubbles */
  prevSenderId?: number | null;
  onReply?: (msg: Message | OptimisticMessage) => void;
  onForward?: (msg: Message | OptimisticMessage) => void;
}

export function MessageBubble({
  message,
  prevSenderId,
  onReply,
  onForward,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const userId = authSDK.getCurrentUser()?.id;

  const isOptimistic = "_tempId" in message;
  const status = isOptimistic
    ? (message as OptimisticMessage)._status
    : undefined;
  const isMine =
    message.remitente?.id === userId ||
    (!message.remitente && !message.es_sistema);

  const senderName = message.remitente?.nombre ?? "Sistema";
  const senderInitials = getInitials(senderName);
  const showAvatar = !isMine && message.remitente?.id !== prevSenderId;
  const isGrouped = !isMine && message.remitente?.id === prevSenderId;

  // System message
  if (message.es_sistema) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full border border-border/30 bg-muted/40 px-3 py-1 text-[10px] text-muted-foreground">
          {message.contenido}
        </span>
      </div>
    );
  }

  const handleCopy = () => {
    void navigator.clipboard.writeText(message.contenido);
  };

  return (
    <div
      className={cn(
        "flex gap-2 group",
        isMine ? "ml-auto flex-row-reverse" : "mr-auto",
        "max-w-[80%]"
      )}
    >
      {/* Avatar */}
      <div className="w-7 shrink-0 flex items-end">
        {showAvatar ? (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground select-none">
            {senderInitials}
          </div>
        ) : null}
      </div>

      <div className="relative min-w-0 flex flex-col">
        {/* Sender name (only for non-mine, first in group) */}
        {!isMine && showAvatar && (
          <span className="mb-0.5 ml-1 text-[10px] font-semibold text-primary/80">
            {senderName}
          </span>
        )}

        {/* Hover actions */}
        <div
          className={cn(
            "absolute -top-6 z-10 flex items-center gap-0.5 rounded-lg border border-border/50 bg-card p-0.5 shadow-md",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isMine ? "right-0" : "left-0"
          )}
        >
          {onReply && (
            <button
              onClick={() => onReply(message)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Reply className="h-3 w-3" />
            </button>
          )}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <circle cx="3" cy="8" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="13" cy="8" r="1.5" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isMine ? "end" : "start"}
              className="w-40"
            >
              <DropdownMenuItem className="gap-2 text-xs" onClick={handleCopy}>
                <Copy className="h-3 w-3" /> Copiar texto
              </DropdownMenuItem>
              {onForward && (
                <DropdownMenuItem
                  className="gap-2 text-xs"
                  onClick={() => onForward(message)}
                >
                  <Forward className="h-3 w-3" /> Reenviar
                </DropdownMenuItem>
              )}
              {isMine && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-xs text-destructive focus:text-destructive">
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm break-words",
            isMine
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted/60 text-foreground rounded-bl-md",
            isGrouped && !isMine && "rounded-tl-md",
            isGrouped && isMine && "rounded-tr-md",
            status === "failed" && "opacity-60 ring-1 ring-destructive/40"
          )}
        >
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
            {message.contenido}
          </p>

          {/* Reference badge */}
          {message.referencia_tipo && message.referencia_id && (
            <ReferenceBadge
              tipo={message.referencia_tipo}
              id={message.referencia_id}
            />
          )}

          {/* Timestamp + status */}
          <div
            className={cn(
              "mt-1 flex items-center gap-1",
              isMine ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-[10px]",
                isMine ? "text-primary-foreground/50" : "text-muted-foreground"
              )}
            >
              {format(new Date(message.fecha_reg), "HH:mm", { locale: es })}
            </span>
            {isMine && <MessageStatus status={status} isMine={isMine} />}
          </div>
        </div>
      </div>
    </div>
  );
}
