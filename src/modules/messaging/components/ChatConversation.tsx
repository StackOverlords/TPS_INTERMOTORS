import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  Info,
  X,
  Reply,
  Loader2,
  Users,
  AlertCircle,
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
import { useOpenChat } from "../hooks/useActiveChat";
import { useSendMessage } from "../hooks/useSendMessage";
import { MessageBubble } from "./MessageBubble";
import { ChatInfoPanel } from "./ChatInfoPanel";
import type { Message, OptimisticMessage } from "../types/Message.types";
import { selectActiveChat, useChatStore } from "../stores/ChatStore";
import { useOfflineQueueStore } from "../stores/OfflineQueueStore";
import { getInitials } from "../mocks/ChatMockUsers";

// ─────────────────────────────────────────────────────────────────────────────
// REPLY PREVIEW BAR
// ─────────────────────────────────────────────────────────────────────────────

interface ReplyBarProps {
  message: Message | OptimisticMessage;
  onCancel: () => void;
}

function ReplyBar({ message, onCancel }: ReplyBarProps) {
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

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE BANNER
// ─────────────────────────────────────────────────────────────────────────────

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
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** If true, shows a back-arrow button (for floating/mobile views) */
  showBackButton?: boolean;
}

export function ChatConversation({ showBackButton = false }: Props) {
  const chat = useChatStore(selectActiveChat);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const pendingCount = useOfflineQueueStore((s) => s.queue.length);

  const [input, setInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | OptimisticMessage | null>(
    null
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);

  // Load messages for active chat
  const {
    messages,
    isLoadingMessages,
    hasOlderMessages,
    loadOlderMessages,
    isFetchingOlderMessages,
  } = useOpenChat(chat?.id ?? 0);

  const { send, isPending: isSending } = useSendMessage(chat?.id ?? 0);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  // Scroll to bottom on chat change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      setTimeout(() => (el.scrollTop = el.scrollHeight), 50);
    }
    setReplyTo(null);
    setInput("");
  }, [chat?.id]);

  // Detect if user is near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 80;

    // Load older messages when scrolled to top
    if (el.scrollTop < 60 && hasOlderMessages && !isFetchingOlderMessages) {
      void loadOlderMessages();
    }
  }, [hasOlderMessages, isFetchingOlderMessages, loadOlderMessages]);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || !chat) return;
    send({ contenido: content });
    setInput("");
    setReplyTo(null);
    inputRef.current?.focus();
    // Force scroll to bottom after send
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, [input, chat, send]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // No active chat selected
  if (!chat) return <EmptyState />;

  const isGroup = chat.tipo !== "DIRECT";
  const canWrite = chat.mi_participacion.puede_escribir;

  return (
    <div className="flex h-full">
      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Header (shrink-0) ───────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-background px-3 py-2.5">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setActiveChatId(null)}
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
                getInitials(chat.nombre)
              )}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{chat.nombre}</p>
            <p className="text-[10px] text-muted-foreground">
              {isGroup
                ? `${chat.participantes.length} participantes`
                : chat.mi_participacion.rol}
            </p>
          </div>

          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 text-muted-foreground",
                    showInfo && "bg-primary/10 text-primary"
                  )}
                  onClick={() => setShowInfo((v) => !v)}
                >
                  <Info className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Info del chat</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Offline banner ──────────────────────────────────────────── */}
        {!isOnline && <OfflineBanner pendingCount={pendingCount} />}

        {/* ── Messages (flex-1 + overflow = only this area scrolls) ─── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 space-y-2 overflow-y-auto bg-muted/5 p-4"
        >
          {/* Load older messages spinner */}
          {isFetchingOlderMessages && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Initial loading */}
          {isLoadingMessages ? (
            <div className="flex flex-1 items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-xs text-muted-foreground">Sin mensajes aún</p>
              <p className="text-[10px] text-muted-foreground/60">
                Sé el primero en escribir
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const prev = messages[i - 1];
              const prevSenderId = prev?.remitente?.id ?? null;
              return (
                <MessageBubble
                  key={
                    "_tempId" in msg
                      ? (msg as OptimisticMessage)._tempId
                      : msg.id
                  }
                  message={msg}
                  prevSenderId={prevSenderId}
                  onReply={setReplyTo}
                />
              );
            })
          )}
        </div>

        {/* ── Reply bar (shrink-0) ────────────────────────────────────── */}
        {replyTo && (
          <ReplyBar message={replyTo} onCancel={() => setReplyTo(null)} />
        )}

        {/* ── Input (shrink-0) ────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border/40 bg-background p-3">
          {canWrite ? (
            <div className="flex items-center gap-2">
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

      {/* ── Info panel (shrink-0, side column) ──────────────────────── */}
      {showInfo && (
        <ChatInfoPanel chat={chat} onClose={() => setShowInfo(false)} />
      )}
    </div>
  );
}
