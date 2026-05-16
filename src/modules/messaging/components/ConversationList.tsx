/**
 *   'list'         → lista de conversaciones (default)
 *   'select-user'  → selección de usuario para chat directo O
 *                    selección múltiple para grupo
 *   'setup-group'  → nombre, descripción y confirmación del grupo
 */
import {
  Search,
  Plus,
  BellOff,
  MoreHorizontal,
  MessageCircle,
  Wifi,
  WifiOff,
  LogOut,
  CheckCheck,
  Users,
  MessageSquare,
  InboxIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { cn } from "@/lib/utils";
import { useChatList } from "../hooks/useChats";
import { useLeaveChat } from "../hooks/useParticipants";
import { UserSelectorPanel } from "./UserSelectorPanel";
import { GroupSetupPanel } from "./GroupSetupPanel";
import type { MessagingUser } from "../types/MessagingUser.types";
import type { Chat } from "../types/Chat.types";
import { useChatStore } from "../stores/ChatStore";
import { useOfflineQueueStore } from "../stores/OfflineQueueStore";
import { useChatTimestamp } from "../hooks/useChatTimestamp";
import { useDraftStore } from "../stores/DraftStore";
import authSDK from "@/services/sdk-simple-auth";
import { Badge } from "@/components/atoms/badge";
import { getFilePreviewByName } from "../utils/filePreview";
import { ConversationAvatar } from "./ConversationAvatar";
import { useChatUIStore } from "../stores/ChatUiStore";

// ─────────────────────────────────────────────────────────────────────────────
// VIEW STATE
// ─────────────────────────────────────────────────────────────────────────────

type PanelView = "list" | "select-user" | "select-group" | "setup-group";

// ─────────────────────────────────────────────────────────────────────────────
// FILTER STATE
// ─────────────────────────────────────────────────────────────────────────────

type ChatFilter = "all" | "unread" | "groups" | "direct";

interface FilterTab {
  id: ChatFilter;
  label: string;
  icon: React.ReactNode;
}

const FILTER_TABS: FilterTab[] = [
  {
    id: "all",
    label: "Todos",
    icon: <InboxIcon className="h-3 w-3" />,
  },
  {
    id: "unread",
    label: "No leídos",
    icon: <MessageCircle className="h-3 w-3" />,
  },
  {
    id: "groups",
    label: "Grupos",
    icon: <Users className="h-3 w-3" />,
  },
  {
    id: "direct",
    label: "Directos",
    icon: <MessageSquare className="h-3 w-3" />,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getFilePreview(msg: Chat["ultimo_mensaje"]): {
  icon: React.ReactNode;
  label: string;
} | null {
  if (!msg) return null;

  if (msg.tipo === "IMAGE" || msg.tipo === "FILE") {
    return getFilePreviewByName(msg.contenido);
  }
  return null;
}

function getLastMessagePreview(
  chat: Chat,
  isDirect: boolean,
  isMine?: boolean
): string {
  const msg = chat.ultimo_mensaje;

  if (!msg) return "";
  if (isDirect) return msg.contenido.slice(0, 60);
  const sender = msg.remitente
    ? isMine
      ? "Tú: "
      : `${msg.remitente.nombre.split(" ")[0]}: `
    : "";
  return `${sender}${msg.contenido}`.slice(0, 60);
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER TABS COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface FilterTabsProps {
  active: ChatFilter;
  onChange: (f: ChatFilter) => void;
  counts: Record<ChatFilter, number>;
}

function FilterTabs({ active, onChange, counts }: FilterTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {FILTER_TABS.map((tab) => {
        const isActive = active === tab.id;
        const count = counts[tab.id];
        const showBadge = tab.id !== "all" && count > 0;

        return (
          <Button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            variant={isActive ? "default" : "secondary"}
            className={
              "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium outline-none h-auto"
            }
          >
            {/* icon — se muestra solo en activo para no saturar */}
            <span
              className={cn(
                "transition-opacity",
                isActive ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}
              aria-hidden
            >
              {tab.icon}
            </span>

            <span>{tab.label}</span>

            {/* badge de conteo */}
            {showBadge && (
              <span
                className={cn(
                  "flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-semibold tabular-nums leading-none",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/15 text-primary"
                )}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE POR FILTRO
// ─────────────────────────────────────────────────────────────────────────────

function FilterEmptyState({
  filter,
  onNewChat,
}: {
  filter: ChatFilter;
  onNewChat: () => void;
}) {
  const config: Record<
    ChatFilter,
    { icon: React.ReactNode; title: string; sub: string; cta?: boolean }
  > = {
    all: {
      icon: <MessageCircle className="h-8 w-8 text-muted-foreground/25" />,
      title: "Sin conversaciones",
      sub: "Crea una nueva para empezar",
      cta: true,
    },
    unread: {
      icon: <CheckCheck className="h-8 w-8 text-emerald-500/40" />,
      title: "Todo al día",
      sub: "No tienes mensajes sin leer",
    },
    groups: {
      icon: <Users className="h-8 w-8 text-muted-foreground/25" />,
      title: "Sin grupos",
      sub: "Crea un grupo para colaborar",
      cta: true,
    },
    direct: {
      icon: <MessageSquare className="h-8 w-8 text-muted-foreground/25" />,
      title: "Sin chats directos",
      sub: "Escribe a alguien de tu equipo",
      cta: true,
    },
  };

  const { icon, title, sub, cta } = config[filter];

  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      {icon}
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground/60">{sub}</p>
      {cta && (
        <Button
          variant="outline"
          size="sm"
          className="mt-1 h-7 text-xs"
          onClick={onNewChat}
        >
          <Plus className="mr-1 h-3 w-3" /> Nueva conversación
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION ITEM
// ─────────────────────────────────────────────────────────────────────────────

interface ItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
  currentUserId?: string | undefined;
}

function ChatTimestamp({ date }: { date: string }) {
  const label = useChatTimestamp(date);
  return (
    <span className="shrink-0 text-[10px] text-muted-foreground/60">
      {label}
    </span>
  );
}

function ConversationItem({
  chat,
  isActive,
  onClick,
  currentUserId,
}: ItemProps) {
  const isGroup = chat.tipo !== "DIRECT";
  const isDirect = chat.tipo === "DIRECT";
  const isSistema = chat.es_sistema;
  const myRole = chat.mi_participacion.rol;
  const lastTime = chat.ultimo_mensaje?.fecha_reg;
  const isMine = chat.ultimo_mensaje?.remitente?.id === currentUserId;

  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const leaveChat = useLeaveChat(chat.id);
  const getDraft = useDraftStore((s) => s.getDraft);

  const draft = getDraft(chat.id);

  const msg = chat.ultimo_mensaje;
  const preview = draft ? null : getLastMessagePreview(chat, isDirect, isMine);

  const handleLeave = () => {
    leaveChat.mutate();
    setActiveChatId(null);
  };

  const canLeave = isDirect || (!isSistema && myRole !== "OWNER");

  const otherParticipantId = !isGroup
    ? chat?.participantes.find(
        (p) => p.usuario?.id.toString() !== currentUserId
      )?.usuario?.id
    : undefined;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/40",
          isActive && "bg-accent/60"
        )}
      >
        <div className="relative shrink-0">
          <ConversationAvatar
            userId={otherParticipantId}
            name={chat.nombre ?? "Usuario desconocido"}
            isGroup={isGroup}
            className="size-11"
            fallbackClassName="text-sm"
            iconClassName="size-5"
          />
          {isSistema && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary">
              <MessageCircle className="h-2 w-2 text-primary-foreground" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold">
                {chat.nombre}
              </span>
              {chat.mi_participacion.silenciado && (
                <BellOff className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
              )}
            </div>
            {lastTime && <ChatTimestamp date={lastTime} />}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            {draft ? (
              <p className="truncate text-[11px]">
                <span className="font-semibold text-amber-500">Borrador:</span>
                <span className="ml-1 text-muted-foreground">{draft}</span>
              </p>
            ) : (
              (() => {
                const filePrev = getFilePreview(chat.ultimo_mensaje);
                if (filePrev) {
                  return (
                    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      {isMine && (
                        <CheckCheck className="mr-0.5 inline size-3 shrink-0 text-blue-500" />
                      )}
                      {!isDirect && isMine && (
                        <span className="shrink-0">Tú:</span>
                      )}
                      {!isDirect && !isMine && msg?.remitente && (
                        <span className="shrink-0">
                          {msg.remitente.nombre.split(" ")[0]}:
                        </span>
                      )}
                      {filePrev.icon}
                      <span>{filePrev.label}</span>
                    </p>
                  );
                }
                return (
                  <p className="truncate text-[11px] text-muted-foreground">
                    {isMine && (
                      <CheckCheck className="mr-1 inline size-3 text-blue-500" />
                    )}
                    {preview || "\u00A0"}
                  </p>
                );
              })()
            )}
            {chat.no_leidos > 0 && (
              <Badge className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px]">
                {chat.no_leidos > 99 ? "99+" : chat.no_leidos}
              </Badge>
            )}
          </div>
        </div>
      </button>

      {/* Context menu on hover */}
      <div className="absolute right-2 top-3 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 bg-background/80 text-muted-foreground hover:bg-accent">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 z-[9999]">
            <DropdownMenuItem className="text-xs">
              {chat.mi_participacion.silenciado
                ? "Activar notificaciones"
                : "Silenciar"}
            </DropdownMenuItem>
            {canLeave && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-xs text-destructive focus:text-destructive"
                  disabled={leaveChat.isPending}
                  onClick={handleLeave}
                >
                  <LogOut className="h-3 w-3" />
                  {isDirect ? "Eliminar conversación" : "Salir del grupo"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export function ConversationList({
  onChatSelected,
}: {
  onChatSelected?: () => void;
}) {
  const currentUserId = authSDK.getCurrentUser()?.id;
  const chats = useChatList();
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const pendingCount = useOfflineQueueStore((s) => s.queue.length);

  const [view, setView] = useState<PanelView>("list");
  const [activeFilter, setActiveFilter] = useState<ChatFilter>("all");

  const [groupSelectedIds, setGroupSelectedIds] = useState<number[]>([]);
  const [groupSelectedUsers, setGroupSelectedUsers] = useState<MessagingUser[]>(
    []
  );

  const [search, setSearch] = useState("");

  // ── Scroll preservation ──────────────────────────────────────────────────
  const scrollListRef = useRef<HTMLDivElement>(null);

  const conversationListScroll = useChatUIStore(
    (s) => s.conversationListScroll
  );
  const chatPositionOnEnter = useChatUIStore((s) => s.chatPositionOnEnter);
  const lastVisitedChatId = useChatUIStore((s) => s.lastVisitedChatId);
  const setConversationListScroll = useChatUIStore(
    (s) => s.setConversationListScroll
  );
  const setChatPositionOnEnter = useChatUIStore(
    (s) => s.setChatPositionOnEnter
  );
  const setLastVisitedChatId = useChatUIStore((s) => s.setLastVisitedChatId);

  // ── Sorted base list ─────────────────────────────────────────────────────
  const sorted = useMemo(
    () =>
      [...chats].sort((a, b) => {
        if (a.no_leidos > 0 && b.no_leidos === 0) return -1;
        if (b.no_leidos > 0 && a.no_leidos === 0) return 1;
        const at = a.ultimo_mensaje?.fecha_reg ?? a.fecha_reg;
        const bt = b.ultimo_mensaje?.fecha_reg ?? b.fecha_reg;
        return new Date(bt).getTime() - new Date(at).getTime();
      }),
    [chats]
  );

  // ── Filter counts (sobre sorted, sin búsqueda) ───────────────────────────
  const counts = useMemo<Record<ChatFilter, number>>(
    () => ({
      all: sorted.length,
      unread: sorted.filter((c) => c.no_leidos > 0).length,
      groups: sorted.filter((c) => c.tipo !== "DIRECT").length,
      direct: sorted.filter((c) => c.tipo === "DIRECT").length,
    }),
    [sorted]
  );

  // ── Filtered + searched list ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = sorted;

    // Aplicar filtro de pestaña
    if (activeFilter === "unread") {
      list = list.filter((c) => c.no_leidos > 0);
    } else if (activeFilter === "groups") {
      list = list.filter((c) => c.tipo !== "DIRECT");
    } else if (activeFilter === "direct") {
      list = list.filter((c) => c.tipo === "DIRECT");
    }

    // Aplicar búsqueda de texto
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.ultimo_mensaje?.contenido.toLowerCase().includes(q)
      );
    }

    return list;
  }, [sorted, activeFilter, search]);

  // Resetear scroll al cambiar filtro
  useEffect(() => {
    if (scrollListRef.current) {
      scrollListRef.current.scrollTop = 0;
    }
  }, [activeFilter]);

  // Al montar (puede ser re-montaje tras volver de un chat)
  useEffect(() => {
    const el = scrollListRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      if (lastVisitedChatId === null) {
        el.scrollTop = conversationListScroll;
        return;
      }

      const currentPosition = sorted.findIndex(
        (c) => c.id === lastVisitedChatId
      );
      const shouldRestore = currentPosition === chatPositionOnEnter;

      if (shouldRestore) {
        el.scrollTop = conversationListScroll;
      } else {
        el.scrollTop = 0;
        setConversationListScroll(0);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  const resetGroupState = () => {
    setGroupSelectedIds([]);
    setGroupSelectedUsers([]);
  };

  const goBack = () => {
    if (view === "setup-group") {
      setView("select-group");
    } else {
      resetGroupState();
      setView("list");
    }
  };

  const handleToggleGroupUser = (user: MessagingUser) => {
    setGroupSelectedIds((prev) => {
      const has = prev.includes(user.id);
      if (has) {
        setGroupSelectedUsers((u) => u.filter((x) => x.id !== user.id));
        return prev.filter((id) => id !== user.id);
      }
      setGroupSelectedUsers((u) => [...u, user]);
      return [...prev, user.id];
    });
  };

  const handleRemoveFromGroup = (userId: number) => {
    setGroupSelectedIds((p) => p.filter((id) => id !== userId));
    setGroupSelectedUsers((p) => p.filter((u) => u.id !== userId));
  };

  const handleNewChat = () => setView("select-user");

  // ── Render ──────────────────────────────────────────────────────────────────

  if (view === "select-user" || view === "select-group") {
    return (
      <UserSelectorPanel
        mode={view === "select-user" ? "direct" : "group"}
        selectedIds={groupSelectedIds}
        onBack={goBack}
        onSelectDirect={() => setView("list")}
        onToggleUserFull={handleToggleGroupUser}
        onNextGroup={() =>
          view === "select-user"
            ? setView("select-group")
            : setView("setup-group")
        }
      />
    );
  }

  if (view === "setup-group") {
    return (
      <GroupSetupPanel
        selectedUsers={groupSelectedUsers}
        onBack={goBack}
        onRemoveUser={handleRemoveFromGroup}
        onSuccess={() => {
          resetGroupState();
          setView("list");
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 space-y-2.5 border-b border-border/40 bg-background p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Mensajes
            </h3>
            {!isOnline && (
              <Tooltip>
                <TooltipTrigger>
                  <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Sin conexión
                  {pendingCount > 0 &&
                    ` · ${pendingCount} mensaje${pendingCount > 1 ? "s" : ""} en cola`}
                </TooltipContent>
              </Tooltip>
            )}
            {isOnline && pendingCount > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Wifi className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Sincronizando {pendingCount} mensaje
                  {pendingCount > 1 ? "s" : ""}...
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                onClick={handleNewChat}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Nueva conversación</TooltipContent>
          </Tooltip>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-xl border-border/30 bg-muted/30 pl-8 text-xs focus-visible:ring-1"
          />
        </div>

        {/* Filter tabs — se ocultan si hay búsqueda activa */}
        {!search && (
          <FilterTabs
            active={activeFilter}
            onChange={(f) => setActiveFilter(f)}
            counts={counts}
          />
        )}
      </div>

      {/* Chat list */}
      <div
        ref={scrollListRef}
        className="flex-1 overflow-y-auto"
        onScroll={() => {
          setConversationListScroll(scrollListRef.current?.scrollTop ?? 0);
        }}
      >
        {filtered.length === 0 ? (
          search ? (
            // Sin resultados de búsqueda
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/25" />
              <p className="text-xs text-muted-foreground">Sin resultados</p>
              <p className="text-[11px] text-muted-foreground/60">
                Intenta con otro término
              </p>
            </div>
          ) : (
            // Empty state contextual al filtro
            <FilterEmptyState filter={activeFilter} onNewChat={handleNewChat} />
          )
        ) : (
          filtered.map((chat) => (
            <ConversationItem
              key={chat.id}
              chat={chat}
              isActive={activeChatId === chat.id}
              onClick={() => {
                const position = sorted.findIndex((c) => c.id === chat.id);
                setChatPositionOnEnter(position);
                setLastVisitedChatId(chat.id);
                setActiveChatId(chat.id);
                onChatSelected?.();
              }}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}
