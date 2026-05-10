/**
 * Layout responsive al ancho del contenedor:
 *
 *   WIDE  (≥ 680px) — ChatInfoPanel como columna lateral derecha (WhatsApp Web)
 *   COMPACT (< 680px) — ChatInfoPanel cubre la conversación (WhatsApp iOS)
 *
 * El padre envuelve este componente con un div con ref={containerRef}
 * para que useChatLayout detecte el ancho correcto.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Send,
  Info,
  X,
  Reply,
  Loader2,
  Users,
  AlertCircle,
  Link,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { cn } from "@/lib/utils";
import { useChatStore, selectActiveChat } from "../stores/ChatStore";
import { useOpenChat } from "../hooks/useActiveChat";
import { useSendMessage } from "../hooks/useSendMessage";
import { useOfflineQueueStore } from "../stores/OfflineQueueStore";
import { MessageBubble } from "./MessageBubble";
import { ChatInfoPanel } from "./ChatInfoPanel";
import { ReferencePickerModal } from "./ReferencePickerModal";
import type {
  Message,
  OptimisticMessage,
  ReferenciaTipo,
} from "../types/Message.types";
import { DateSeparator } from "./DateSeparator";
import { useDraftStore } from "../stores/DraftStore";

function getInitials(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ReplyBar({
  message,
  onCancel,
}: {
  message: Message | OptimisticMessage;
  onCancel: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-border/30 bg-background px-3 pt-2">
      <div className="flex items-center gap-2 rounded-xl border-l-2 border-primary bg-muted/30 px-3 py-2">
        <Reply className="h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-primary">
            {message.remitente?.nombre ?? "Sistema"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {message.contenido}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/5">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/30 bg-muted/30">
          <Users className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Selecciona una conversación
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">
            O crea una nueva para empezar
          </p>
        </div>
      </div>
    </div>
  );
}

function OfflineBanner({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 py-1.5">
      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
      <p className="text-[11px] text-amber-600">
        Sin conexión
        {pendingCount > 0 &&
          ` · ${pendingCount} mensaje${pendingCount > 1 ? "s" : ""} en cola`}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  showBackButton?: boolean;
  /**
   * Forzar modo compacto desde el padre (ventana flotante, panel lateral).
   * Si no se pasa, se detecta automáticamente por el ancho del contenedor.
   */
  compact?: boolean;
  /**
   * Cuando el padre (ChatLayout) gestiona el panel de info externamente.
   * Si se pasa, el botón Info controla el estado del padre en lugar de
   * gestionar el panel internamente.
   */
  infoActive?: boolean;
  onToggleInfo?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ChatConversation({
  showBackButton = false,
  compact: compactProp,
  infoActive: infoActiveProp,
  onToggleInfo: onToggleInfoProp,
}: Props) {
  const chat = useChatStore(selectActiveChat);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const pendingCount = useOfflineQueueStore((s) => s.queue.length);

  const [input, setInput] = useState("");
  // showInfo: controlado externamente por ChatLayout (infoActiveProp) O internamente
  const [showInfoInternal, setShowInfoInternal] = useState(false);
  const showInfo =
    infoActiveProp !== undefined ? infoActiveProp : showInfoInternal;
  const toggleInfo = onToggleInfoProp ?? (() => setShowInfoInternal((v) => !v));
  const closeInfo = onToggleInfoProp
    ? () => {
        if (infoActiveProp) onToggleInfoProp();
      }
    : () => setShowInfoInternal(false);

  const [replyTo, setReplyTo] = useState<Message | OptimisticMessage | null>(
    null
  );
  const [showRefPicker, setShowRefPicker] = useState(false);
  const [reference, setReference] = useState<{
    tipo: ReferenciaTipo;
    id: number;
  } | null>(null);

  // ── Responsive detection ───────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompactDetected, setIsCompactDetected] = useState(true);
  const isCompact = compactProp ?? isCompactDetected;

  useEffect(() => {
    if (compactProp !== undefined) return; // padre controla, no medir
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setIsCompactDetected(w < 680);
    });
    observer.observe(el);
    setIsCompactDetected(el.getBoundingClientRect().width < 680);
    return () => observer.disconnect();
  }, [compactProp]);

  // ── Scroll ─────────────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);

  const pendingDirectChat = useChatStore((s) => s.pendingDirectChat);
  const setPendingDirectChat = useChatStore((s) => s.setPendingDirectChat);

  // Draft — cargar al montar/cambiar de chat, guardar al escribir
  const getDraft = useDraftStore((s) => s.getDraft);
  const setDraft = useDraftStore((s) => s.setDraft);
  const clearDraft = useDraftStore((s) => s.clearDraft);

  // El "chatId efectivo" para drafts: si es pending usamos userId como key negativa
  const draftKey =
    chat?.id ?? (pendingDirectChat ? -pendingDirectChat.userId : null);

  const {
    messages,
    isLoadingMessages,
    hasOlderMessages,
    loadOlderMessages,
    isFetchingOlderMessages,
  } = useOpenChat(chat?.id ?? 0);

  const { send, isPending: isSending } = useSendMessage(chat?.id ?? 0);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && isAtBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Cargar borrador al cambiar de chat o al abrir un pending
  useEffect(() => {
    const el = scrollRef.current;
    if (el) setTimeout(() => (el.scrollTop = el.scrollHeight), 50);
    setReplyTo(null);
    setReference(null);
    closeInfo();

    const savedDraft = draftKey !== null ? getDraft(draftKey as number) : null;
    setInput(savedDraft ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id, pendingDirectChat?.userId]);

  // Guardar borrador con debounce al escribir
  useEffect(() => {
    if (draftKey === null) return;
    const timer = setTimeout(() => {
      setDraft(draftKey as number, input);
    }, 500); // debounce 500ms para no escribir en cada keystroke
    return () => clearTimeout(timer);
  }, [input, draftKey, setDraft]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 60 && hasOlderMessages && !isFetchingOlderMessages)
      void loadOlderMessages();
  }, [hasOlderMessages, isFetchingOlderMessages, loadOlderMessages]);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content) return;
    if (!chat && !pendingDirectChat) return; // nada seleccionado
    send({
      contenido: content,
      referencia_tipo: reference?.tipo,
      referencia_id: reference?.id,
    });
    setInput("");
    setReplyTo(null);
    setReference(null);
    if (draftKey !== null) clearDraft(draftKey as number);
    inputRef.current?.focus();
    setTimeout(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }, [input, chat, pendingDirectChat, send, reference, draftKey, clearDraft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Pending: mostrar vista de conversación vacía con nombre del usuario destino
  const isPending = !chat && !!pendingDirectChat;
  if (!chat && !pendingDirectChat) return <EmptyState />;

  // Valores derivados del chat real O del pending
  const chatNombre = chat?.nombre ?? pendingDirectChat?.nombre ?? "";
  const isGroup = chat ? chat.tipo !== "DIRECT" : false;
  const canWrite = chat ? chat.mi_participacion.puede_escribir : true; // pending = siempre puede escribir

  // ── Info panel shown in compact mode (covers conversation) ────────────────
  const showInfoOverlay = showInfo && isCompact;

  // ── Info panel shown in wide mode (side column) ───────────────────────────
  const showInfoSide = showInfo && !isCompact;

  return (
    <div ref={containerRef} className="flex h-full relative">
      {/* ── Main column ──────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          showInfoSide && "border-r border-border/40"
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-background px-3 py-2.5">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                if (isPending) {
                  setPendingDirectChat(null);
                } else {
                  setActiveChatId(null);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback
              className={cn(
                "text-xs font-semibold",
                isGroup
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isGroup ? (
                <Users className="h-4 w-4" />
              ) : (
                getInitials(chatNombre)
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{chatNombre}</p>
            <p className="text-[10px] text-muted-foreground">
              {isPending
                ? "Nuevo mensaje — escribe para iniciar la conversación"
                : isGroup
                  ? `${chat!.participantes.length} participantes`
                  : chat!.tipo_label}
            </p>
          </div>
          {/* Info button solo cuando hay chat real */}
          {!isPending && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 text-muted-foreground",
                    showInfo && "bg-primary/10 text-primary"
                  )}
                  onClick={() => toggleInfo()}
                >
                  <Info className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Info del chat</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Offline banner */}
        {!isOnline && <OfflineBanner pendingCount={pendingCount} />}

        {/* Messages area — position relative para el overlay */}
        <div className="relative flex-1 overflow-hidden">
          {/* Messages scroll */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 space-y-2 overflow-y-auto bg-muted/5 p-4"
          >
            {isFetchingOlderMessages && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {isLoadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-xs text-muted-foreground">
                  Sin mensajes aún
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  Sé el primero en escribir
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const prev = messages[i - 1];

                // Comparar solo la fecha (sin hora) para detectar cambio de día
                const msgDay = new Date(msg.fecha_reg);
                msgDay.setHours(0, 0, 0, 0);

                const prevDay = prev ? new Date(prev.fecha_reg) : null;
                if (prevDay) prevDay.setHours(0, 0, 0, 0);

                const showSeparator =
                  !prevDay || msgDay.getTime() !== prevDay.getTime();

                return (
                  <div
                    key={
                      "_tempId" in msg
                        ? (msg as OptimisticMessage)._tempId
                        : msg.id
                    }
                  >
                    {showSeparator && <DateSeparator date={msg.fecha_reg} />}
                    <MessageBubble
                      message={msg}
                      prevSenderId={prev?.remitente?.id ?? null}
                      onReply={setReplyTo}
                      isDirectChat={chat?.tipo === "DIRECT"}
                      otherDate={showSeparator}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reply bar */}
        {replyTo && (
          <ReplyBar message={replyTo} onCancel={() => setReplyTo(null)} />
        )}

        {/* Reference preview */}
        {reference && (
          <div className="shrink-0 border-t border-border/30 bg-background px-3 pt-2">
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5">
              <Link className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="flex-1 text-[11px] font-semibold text-primary">
                {reference.tipo} #{reference.id}
              </span>
              <button
                onClick={() => setReference(null)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-border/40 bg-background p-3">
          {canWrite ? (
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-xl text-muted-foreground",
                      reference && "bg-primary/10 text-primary"
                    )}
                    onClick={() => setShowRefPicker(true)}
                    disabled={isSending}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {reference
                    ? `Referencia: ${reference.tipo} #${reference.id}`
                    : "Vincular documento"}
                </TooltipContent>
              </Tooltip>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="h-9 rounded-xl border-border/30 bg-muted/20 px-4 text-sm focus-visible:ring-1"
                disabled={isSending}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl"
                disabled={!input.trim() || isSending}
                onClick={handleSend}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <p className="text-center text-[11px] text-muted-foreground">
              No tienes permiso para enviar mensajes en este chat
            </p>
          )}
        </div>
      </div>

      {/* ── COMPACT: info panel cubre la conversación (slide-in) ──── */}
      {showInfoOverlay && (
        <div className="absolute inset-0 z-10 bg-background">
          <ChatInfoPanel chat={chat!} onClose={() => closeInfo()} />
        </div>
      )}

      {/* ── WIDE: info panel como columna lateral ────────────────────────── */}
      {showInfoSide && (
        <div className="w-[260px] shrink-0">
          <ChatInfoPanel chat={chat!} onClose={() => closeInfo()} />
        </div>
      )}

      <ReferencePickerModal
        open={showRefPicker}
        onClose={() => setShowRefPicker(false)}
        onSelect={(tipo, id) => setReference({ tipo, id })}
      />
    </div>
  );
}
