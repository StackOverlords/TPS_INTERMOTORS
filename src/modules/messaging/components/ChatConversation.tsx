/**
 *  - Estado de edición (editingMessage): muestra una EditBar encima del input,
 *    similar a la ReplyBar, con el texto pre-cargado. Presionar Esc o × cancela.
 *  - useEditMessage / useDeleteMessage conectados a MessageBubble
 *  - canModerate derivado de mi_participacion.rol
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  Pencil,
  Check,
  Dot,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
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
import { useSendAttachment } from "../hooks/useSendAttachment";
import { FilePickerButton } from "./FilePickerButton";
import { isImageMime, validateAttachment } from "../types/Attachment.types";
import { AttachmentComposer } from "./AttachmentComposer";
import { ConversationAvatar } from "./ConversationAvatar";
import authSDK from "@/services/sdk-simple-auth";
import { useEditMessage } from "../hooks/useEditMessage";
import { useDeleteMessage } from "../hooks/useDeleteMessage";
import { Textarea } from "@/components/atoms/textarea";
import { usePresenceStore } from "../stores/PresenceStore";

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

/**
 * barra de edición — reemplaza la ReplyBar cuando el usuario
 * está editando un mensaje existente.
 */
function EditBar({
  message,
  onCancel,
}: {
  message: Message;
  onCancel: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-border/30 bg-background px-3 pt-2">
      <div className="flex items-center gap-2 rounded-xl border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2">
        <Pencil className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-amber-600">
            Editando mensaje
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
  const currentUserId = authSDK.getCurrentUser()?.id;
  const chat = useChatStore(selectActiveChat);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const pendingCount = useOfflineQueueStore((s) => s.queue.length);

  const [input, setInput] = useState("");
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

  // estado de edición
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // ── Responsive ─────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompactDetected, setIsCompactDetected] = useState(true);
  const isCompact = compactProp ?? isCompactDetected;

  useEffect(() => {
    if (compactProp !== undefined) return;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);
  const prevScrollHeightRef = useRef<number | null>(null);

  const pendingDirectChat = useChatStore((s) => s.pendingDirectChat);
  const setPendingDirectChat = useChatStore((s) => s.setPendingDirectChat);

  // Draft
  const getDraft = useDraftStore((s) => s.getDraft);
  const setDraft = useDraftStore((s) => s.setDraft);
  const clearDraft = useDraftStore((s) => s.clearDraft);

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

  // hooks de edición y eliminación
  const editMutation = useEditMessage(chat?.id ?? 0);
  const { deleteForAll, deleteForMe } = useDeleteMessage(chat?.id ?? 0);

  const { send: sendAttachment } = useSendAttachment(chat?.id ?? 0);

  // ── Pending file ────────────────────────────────────────────────────────────
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null
  );
  const [attachError, setAttachError] = useState<string | null>(null);
  const [isUploadingSending, setIsUploadingSending] = useState(false);

  const clearPendingFile = useCallback(() => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setAttachError(null);
    setIsUploadingSending(false);
  }, [pendingPreviewUrl]);

  useEffect(
    () => () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    },
    [pendingPreviewUrl]
  );

  const handleFileSelected = (file: File) => {
    const validation = validateAttachment(file);
    const previewUrl = isImageMime(file.type)
      ? URL.createObjectURL(file)
      : null;
    setPendingFile(file);
    setPendingPreviewUrl(previewUrl);
    setAttachError(validation.valid ? null : validation.error);
    setIsUploadingSending(false);
  };

  const handleAttachmentSend = async (caption: string) => {
    if (!pendingFile) return;
    setIsUploadingSending(true);
    setAttachError(null);
    try {
      await sendAttachment({ file: pendingFile, caption });
      clearPendingFile();
    } catch (err) {
      setAttachError((err as Error).message ?? "Error al subir el archivo");
      setIsUploadingSending(false);
    }
    setTimeout(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  // ── Scroll auto ─────────────────────────────────────────────────────────────
  const isInitialLoadRef = useRef(true);

  // Al cambiar de chat → resetear flags
  useEffect(() => {
    isInitialLoadRef.current = true;
    isAtBottomRef.current = true;
  }, [chat?.id, pendingDirectChat?.userId]);

  // ResizeObserver: corrige el scroll cada vez que el contenido crece
  // (imágenes que cargan, mensajes nuevos, etc.)
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const observer = new ResizeObserver(() => {
      if (isInitialLoadRef.current || isAtBottomRef.current) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    });

    const inner = scrollEl.firstElementChild;
    if (inner) observer.observe(inner);

    return () => observer.disconnect();
  }, [chat?.id, pendingDirectChat?.userId]);

  // Cuando llegan los primeros mensajes del chat
  useEffect(() => {
    if (isLoadingMessages) return;
    if (isInitialLoadRef.current && messages.length > 0) {
      isInitialLoadRef.current = false;
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages.length, isLoadingMessages]);

  // ── Scroll para mensajes en tiempo real (WebSocket) ─────────────────────────
  const prevMessageCountRef = useRef(messages.length);

  useEffect(() => {
    const prev = prevMessageCountRef.current;
    const curr = messages.length;
    prevMessageCountRef.current = curr;

    // Solo actuar cuando se agrega al menos un mensaje (no en carga inicial)
    if (curr <= prev || isInitialLoadRef.current) return;

    // Si el usuario está al fondo (o casi), hacer scroll
    if (isAtBottomRef.current) {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages.length]);

  useEffect(() => {
    setReplyTo(null);
    setReference(null);
    setEditingMessage(null); // limpiar edición al cambiar de chat
    closeInfo();
    isAtBottomRef.current = true;
    const savedDraft = draftKey !== null ? getDraft(draftKey as number) : null;
    setInput(savedDraft ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id, pendingDirectChat?.userId]);

  // Guardar borrador (NO guardar cuando estamos editando)
  useEffect(() => {
    if (draftKey === null || editingMessage) return;
    const timer = setTimeout(() => {
      setDraft(draftKey as number, input);
    }, 500);
    return () => clearTimeout(timer);
  }, [input, draftKey, setDraft, editingMessage]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    if (el.scrollTop < 60 && hasOlderMessages && !isFetchingOlderMessages) {
      void loadOlderMessages();
    }
  }, [hasOlderMessages, isFetchingOlderMessages, loadOlderMessages]);

  // Este efecto corre ANTES de pintar (useLayoutEffect) cuando pages.length crece,
  // pero necesitamos el valor ANTES de que el DOM cambie → lo capturamos en un
  // useLayoutEffect que se dispara en isFetchingNextPage
  useLayoutEffect(() => {
    // Cuando EMPIEZA a fetchear: capturar scrollHeight actual
    if (isFetchingOlderMessages) {
      const el = scrollRef.current;
      if (el) prevScrollHeightRef.current = el.scrollHeight;
    }
  }, [isFetchingOlderMessages]);

  // Cuando TERMINA de fetchear y el DOM ya tiene los nuevos mensajes: restaurar
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current === null) return;
    const el = scrollRef.current;
    if (!el) return;

    const diff = el.scrollHeight - prevScrollHeightRef.current;
    if (diff > 0) {
      el.scrollTop += diff;
    }
    prevScrollHeightRef.current = null;
  }, [messages.length]);

  // ── EDICIÓN ───────────────────────────────────────────────────────

  const handleStartEdit = useCallback((msg: Message) => {
    setEditingMessage(msg);
    setInput(msg.contenido); // pre-cargar el texto actual
    setReplyTo(null);
    inputRef.current?.focus();
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setInput(""); // limpiar o restaurar borrador
    const draft = draftKey !== null ? getDraft(draftKey as number) : null;
    setInput(draft ?? "");
  }, [draftKey, getDraft]);

  // ── SEND (envío normal + confirmar edición) ─────────────────────────────────
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content) return;

    if (editingMessage) {
      // confirmar edición
      if (content !== editingMessage.contenido) {
        editMutation.mutate({
          messageId: editingMessage.id,
          payload: { contenido: content },
          previousContent: editingMessage.contenido,
        });
      }
      setEditingMessage(null);
      setInput("");
      inputRef.current?.focus();
      return;
    }

    if (!chat && !pendingDirectChat) return;
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
  }, [
    input,
    editingMessage,
    chat,
    pendingDirectChat,
    send,
    reference,
    draftKey,
    clearDraft,
    editMutation,
  ]);

  const adjustTextareaHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  // Resetear altura cuando se limpia el input
  useEffect(() => {
    if (!input && inputRef.current) {
      inputRef.current.style.height = "auto";
    } else {
      adjustTextareaHeight();
    }
  }, [input, adjustTextareaHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && editingMessage) {
      handleCancelEdit();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // permisos de moderación
  const canModerate =
    chat?.mi_participacion.rol === "OWNER" ||
    chat?.mi_participacion.rol === "ADMIN";

  const isPending = !chat && !!pendingDirectChat;
  if (!chat && !pendingDirectChat) return <EmptyState />;

  const chatNombre = chat?.nombre ?? pendingDirectChat?.nombre ?? "";
  const isGroup = chat ? chat.tipo !== "DIRECT" : false;
  const canWrite = chat ? chat.mi_participacion.puede_escribir : true;

  const showInfoOverlay = showInfo && isCompact;
  const showInfoSide = showInfo && !isCompact;

  const otherParticipantId = !isGroup
    ? chat?.participantes.find(
        (p) => p.usuario?.id.toString() !== currentUserId
      )?.usuario?.id
    : undefined;

  // Participantes online (excluye al usuario actual)
  const onlineUserIds = usePresenceStore((s) => {
    void s._tick; // dependencia reactiva
    return s.onlineUserIds;
  });
  const presenceConnected = usePresenceStore((s) => s.presenceConnected);

  const onlineCount = chat
    ? chat.participantes.filter(
        (p) => p.usuario?.id !== undefined && onlineUserIds.has(p.usuario.id)
      ).length
    : 0;

  return (
    <div ref={containerRef} className="flex h-full relative">
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
                if (isPending) setPendingDirectChat(null);
                else setActiveChatId(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <ConversationAvatar
            userId={otherParticipantId}
            name={chatNombre}
            isGroup={isGroup}
            className="size-9"
            fallbackClassName="text-xs"
            iconClassName="size-4"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{chatNombre}</p>
            <p className="text-[10px] text-muted-foreground">
              {isPending ? (
                "Nuevo mensaje — escribe para iniciar la conversación"
              ) : isGroup ? (
                <span className="flex items-center gap-1.5">
                  <span>{chat!.participantes.length} participantes</span>
                  {presenceConnected && onlineCount > 0 && (
                    <>
                      <Dot className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="flex items-center gap-1">
                        {onlineCount} en línea
                      </span>
                    </>
                  )}
                </span>
              ) : presenceConnected ? (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    otherParticipantId !== undefined &&
                      onlineUserIds.has(otherParticipantId)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {otherParticipantId !== undefined &&
                  onlineUserIds.has(otherParticipantId)
                    ? "En línea"
                    : "Desconectado"}
                </span>
              ) : (
                chat!.tipo_label
              )}
            </p>
          </div>
          {!isPending && isGroup && (
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
              <TooltipContent side="bottom">Info. del chat</TooltipContent>
            </Tooltip>
          )}
        </div>

        {!isOnline && <OfflineBanner pendingCount={pendingCount} />}

        {/* Messages area */}
        <div className="relative flex-1 overflow-hidden">
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
                      // EDICIÓN
                      onEdit={handleStartEdit}
                      onDeleteForAll={(m) => deleteForAll.mutate(m.id)}
                      onDeleteForMe={(m) => deleteForMe.mutate(m.id)}
                      canModerate={canModerate}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* EditBar — prioridad sobre ReplyBar */}
        {editingMessage ? (
          <EditBar message={editingMessage} onCancel={handleCancelEdit} />
        ) : (
          replyTo && (
            <ReplyBar message={replyTo} onCancel={() => setReplyTo(null)} />
          )
        )}

        {/* Reference preview */}
        {reference && !pendingFile && !editingMessage && (
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

        {/* Input area */}
        <div className="shrink-0 bg-background px-3 py-2.5">
          {canWrite ? (
            pendingFile && !editingMessage ? (
              <AttachmentComposer
                file={pendingFile}
                previewUrl={pendingPreviewUrl}
                isSending={isUploadingSending}
                error={attachError}
                onSend={handleAttachmentSend}
                onCancel={clearPendingFile}
              />
            ) : (
              <div
                className={cn(
                  "flex items-end gap-1 rounded-2xl border p-2",
                  editingMessage ? "border-amber-500/50" : "border-border"
                )}
              >
                {/* Botón archivo — solo cuando no se está editando */}
                {!editingMessage && (
                  <>
                    <FilePickerButton
                      disabled={isSending}
                      onFileSelected={handleFileSelected}
                      // className="mb-0.5 shrink-0"
                    />
                    {/* Vincular documento */}
                    {/* <Tooltip>
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
                  </Tooltip> */}
                  </>
                )}

                {/* Textarea autoexpandible */}
                <Textarea
                  ref={inputRef}
                  value={input}
                  rows={1}
                  onChange={(e) => {
                    setInput(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    editingMessage
                      ? "Editar mensaje... (Esc para cancelar)"
                      : "Escribe un mensaje..."
                  }
                  disabled={isSending || editMutation.isPending}
                  className={cn(
                    "min-h-0 resize-none border-0 bg-transparent p-0 py-1",
                    "shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                    "max-h-[120px] overflow-y-auto text-sm leading-relaxed",
                    editingMessage && "text-foreground"
                  )}
                />

                {/* Botón enviar */}
                <Button
                  size="icon"
                  className={cn(
                    "shrink-0",
                    editingMessage && "bg-amber-500 hover:bg-amber-600"
                  )}
                  disabled={
                    !input.trim() || isSending || editMutation.isPending
                  }
                  onClick={handleSend}
                >
                  {isSending || editMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingMessage ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          ) : (
            <p className="text-center text-[11px] text-muted-foreground py-2">
              No tienes permiso para enviar mensajes en este chat
            </p>
          )}
        </div>
      </div>

      {/* Info panel — compact overlay */}
      {showInfoOverlay && (
        <div className="absolute inset-0 z-10 bg-background">
          <ChatInfoPanel chat={chat!} onClose={() => closeInfo()} />
        </div>
      )}

      {/* Info panel — wide side column */}
      {showInfoSide && (
        <div className="w-[360px] shrink-0">
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
