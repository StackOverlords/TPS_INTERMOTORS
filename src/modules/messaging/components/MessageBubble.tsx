/**
 *  - Badge "editado" cuando editado === true
 *  - Botones contextual: Editar (solo propio TEXT < 24h) / Eliminar para todos / Eliminar para mí
 *  - Moderar (OWNER/ADMIN pueden eliminar cualquier mensaje para todos)
 *  - Estado visual cuando eliminado === true (placeholder)
 *  - Props nuevas: onEdit, onDeleteForAll, onDeleteForMe, canModerate
 */
import { format, differenceInHours } from "date-fns";
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
  ExternalLink,
  Ellipsis,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import type { Message, OptimisticMessage } from "../types/Message.types";
import authSDK from "@/services/sdk-simple-auth";
import { Button } from "@/components/atoms/button";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { AttachmentMessage } from "./AttachmentMessage";
import { getInitials } from "../utils/chatUtils";

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE BADGE
// ─────────────────────────────────────────────────────────────────────────────

const REFERENCE_ROUTES: Record<string, (id: number) => string> = {
  sale: (id) => `/dashboard/sales/${id}`,
  purchase: (id) => `/dashboard/purchases/${id}`,
  transfer: (id) => `/dashboard/transfers/${id}`,
  almacen_out: (id) => `/dashboard/warehouse/out/${id}`,
  almacen_in: (id) => `/dashboard/warehouse/in/${id}`,
};

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

  const route = REFERENCE_ROUTES[tipo]?.(id);

  return (
    <button
      onClick={() => route && (window.location.href = route)}
      disabled={!route}
      className={cn(
        "mt-1.5 flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-left transition-colors",
        route && "hover:border-primary/40 hover:bg-primary/10 cursor-pointer",
        !route && "cursor-default"
      )}
    >
      <span className="text-primary">
        {icons[tipo] ?? <Package className="h-3 w-3" />}
      </span>
      <span className="text-[11px] font-semibold text-primary">
        {labels[tipo] ?? tipo} #{id}
      </span>
      {route && <ExternalLink className="ml-auto h-3 w-3 text-primary/50" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS ICON
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
// HELPERS — restricciones de edición y eliminación
// ─────────────────────────────────────────────────────────────────────────────

function canEditMessage(message: Message, myId: string | undefined): boolean {
  if (!myId) return false;
  if (String(message.remitente?.id) !== String(myId)) return false;
  if (message.tipo !== "TEXT") return false;
  if (message.es_sistema) return false;
  // Solo dentro de las primeras 24 horas
  return differenceInHours(new Date(), new Date(message.fecha_reg)) < 24;
}

function canDeleteForAll(
  message: Message,
  myId: string | undefined,
  canModerate: boolean,
  isDirectChat: boolean
): boolean {
  if (message.es_sistema) return false;
  // En chat directo nunca se puede borrar el mensaje del otro para ambos
  if (isDirectChat && String(message.remitente?.id) !== String(myId))
    return false;
  // OWNER/ADMIN pueden eliminar cualquier mensaje sin límite de tiempo
  if (canModerate && !isDirectChat) return true;
  // El remitente puede eliminar sus propios mensajes dentro de 24h
  if (String(message.remitente?.id) !== String(myId)) return false;
  return differenceInHours(new Date(), new Date(message.fecha_reg)) < 24;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  message: Message | OptimisticMessage;
  /** Previous message sender id — to group consecutive bubbles */
  prevSenderId?: number | null;
  onReply?: (msg: Message | OptimisticMessage) => void;
  onForward?: (msg: Message | OptimisticMessage) => void;
  /** callback para iniciar edición (el padre gestiona el estado) */
  onEdit?: (msg: Message) => void;
  /** eliminar para todos */
  onDeleteForAll?: (msg: Message) => void;
  /** eliminar solo para mí */
  onDeleteForMe?: (msg: Message) => void;
  /** true si el usuario es OWNER o ADMIN del chat */
  canModerate?: boolean;
  isDirectChat?: boolean;
  otherDate?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function MessageBubble({
  message,
  prevSenderId,
  onReply,
  onForward,
  onEdit,
  onDeleteForAll,
  onDeleteForMe,
  canModerate = false,
  isDirectChat = false,
  otherDate = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUserId = authSDK.getCurrentUser()?.id;

  const isOptimistic = "_tempId" in message;
  const status = isOptimistic
    ? (message as OptimisticMessage)._status
    : undefined;
  const isMine =
    message.remitente?.id === currentUserId ||
    (!message.remitente && !message.es_sistema);
  const senderName = message.remitente?.nombre ?? "Sistema";
  const senderInitials = getInitials(senderName);
  const showAvatar = !isMine && message.remitente?.id !== prevSenderId;
  const isGrouped = !otherDate && message.remitente?.id === prevSenderId;

  // mensaje eliminado localmente (para_mi)
  if ((message as Message).eliminado) {
    return (
      <div
        className={cn(
          "flex gap-2",
          isMine ? "ml-auto flex-row-reverse" : "mr-auto",
          "max-w-[80%]"
        )}
      >
        <div className="w-7 shrink-0" />
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-xs italic text-muted-foreground",
            isMine ? "bg-primary/10" : "bg-muted/30"
          )}
        >
          Mensaje eliminado
        </div>
      </div>
    );
  }

  // Mensaje de sistema
  if (message.es_sistema) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full border border-border/30 bg-muted/40 px-3 py-1 text-[10px] italic text-muted-foreground">
          {message.contenido}
        </span>
      </div>
    );
  }

  // permisos de edición/eliminación
  const realMessage = isOptimistic ? undefined : (message as Message);
  const canEdit =
    !isOptimistic &&
    realMessage !== undefined &&
    !!onEdit &&
    canEditMessage(realMessage, currentUserId);

  const canDelForAll =
    !isOptimistic &&
    realMessage !== undefined &&
    !!onDeleteForAll &&
    canDeleteForAll(realMessage, currentUserId, canModerate, isDirectChat);

  const canDelForMe =
    !isOptimistic && realMessage !== undefined && !!onDeleteForMe;

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
      <div className="w-7 shrink-0 flex items-start">
        {showAvatar && !isDirectChat ? (
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
              {senderInitials}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>

      <div className="relative min-w-0 flex flex-col">
        {/* Sender name */}
        {!isMine && showAvatar && !isDirectChat && (
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
            <Button
              variant="ghost"
              onClick={() => onReply(message)}
              className="size-6"
            >
              <Reply className="size-3" />
            </Button>
          )}

          {/* botón editar rápido (solo cuando aplica) */}
          {canEdit && (
            <Button
              variant="ghost"
              className="size-6"
              title="Editar"
              onClick={() => onEdit!(realMessage!)}
            >
              <Pencil className="size-3" />
            </Button>
          )}

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-6">
                <Ellipsis className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isMine ? "end" : "start"}
              className="w-44 z-[9999]"
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

              {/* editar */}
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-xs"
                    onClick={() => onEdit!(realMessage!)}
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </DropdownMenuItem>
                </>
              )}

              {/* eliminar */}
              {(canDelForAll || canDelForMe) && (
                <>
                  <DropdownMenuSeparator />
                  {canDelForAll && (
                    <DropdownMenuItem
                      className="gap-2 text-xs text-destructive focus:text-destructive"
                      onClick={() => onDeleteForAll!(realMessage!)}
                    >
                      <Trash2 className="h-3 w-3" /> Eliminar para todos
                    </DropdownMenuItem>
                  )}
                  {canDelForMe && (
                    <DropdownMenuItem
                      className="gap-2 text-xs text-muted-foreground"
                      onClick={() => onDeleteForMe!(realMessage!)}
                    >
                      <Trash2 className="h-3 w-3" /> Eliminar para mí
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl text-sm break-words",
            message.tipo === "FILE" && message.adjuntos?.[0]?.es_imagen
              ? "overflow-hidden px-1.5 pt-0.5 pb-1"
              : message.tipo === "FILE"
                ? "px-1.5 pt-0.5 pb-1"
                : "px-3 py-1",
            isMine
              ? "bg-primary text-primary-foreground rounded-tr-xs"
              : "bg-secondary text-foreground rounded-tl-xs",
            isGrouped && !isMine && "rounded-tl-2xl",
            isGrouped && isMine && "rounded-tr-2xl",
            status === "failed" && "opacity-60 ring-1 ring-destructive/40"
          )}
        >
          {/* Adjuntos */}
          {message.tipo === "FILE" &&
          message.adjuntos &&
          message.adjuntos.length > 0 ? (
            <>
              <AttachmentMessage
                adjuntos={message.adjuntos}
                optimistic={
                  isOptimistic ? (message as OptimisticMessage) : undefined
                }
                isMine={isMine}
              />
              {message.contenido && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap px-1.5">
                  {message.contenido}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.contenido}
            </p>
          )}

          {/* Reference badge */}
          {message.referencia_tipo && message.referencia_id && (
            <ReferenceBadge
              tipo={message.referencia_tipo}
              id={message.referencia_id}
            />
          )}

          {/* Timestamp + status + badge "editado" */}
          <div className="flex items-center gap-1 justify-end mt-0.5 flex-wrap">
            {/* badge editado */}
            {(message as Message).editado && (
              <span
                className={cn(
                  "text-[9px] italic",
                  isMine
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground/70"
                )}
              >
                editado
              </span>
            )}
            <span
              className={cn(
                "text-[10px]",
                isMine ? "text-primary-foreground/80" : "text-muted-foreground"
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
