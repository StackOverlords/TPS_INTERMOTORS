/**
 *    → endpoint /messaging/users con campo online/last_seen_at
 *  - Indicador de presencia en tiempo real (círculo verde/gris)
 *  - Sin paginación infinita: el endpoint devuelve todos los usuarios
 *    de las sucursales del usuario autenticado en una sola llamada.
 *    Si la lista es grande el backend ya la filtra por sucursal.
 *  - Search local sobre los datos cargados (el API soporta ?buscar= pero
 *    la búsqueda local es más responsiva).
 */
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Users,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";
import { useMessagingUsersFlat } from "../hooks/useMessagingUsers";
import type { MessagingUser } from "../types/MessagingUser.types";
import { useChatStore } from "../stores/ChatStore";
import { getInitials } from "../utils/chatUtils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SelectorMode = "direct" | "group";

interface Props {
  mode: SelectorMode;
  selectedIds: number[];
  onBack: () => void;
  onSelectDirect: () => void;
  onToggleUser: (id: number) => void; // solo id (compat)
  onToggleUserFull: (user: MessagingUser) => void;
  onNextGroup: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background",
        online ? "bg-emerald-500" : "bg-muted-foreground/30"
      )}
    />
  );
}

function lastSeenLabel(user: MessagingUser): string {
  if (user.online) return "En línea";
  if (!user.last_seen_at) return "Desconectado";
  try {
    return `Visto ${formatDistanceToNow(new Date(user.last_seen_at), {
      addSuffix: true,
      locale: es,
    })}`;
  } catch {
    return "Desconectado";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ROW
// ─────────────────────────────────────────────────────────────────────────────

interface RowProps {
  user: MessagingUser;
  isSelected: boolean;
  mode: SelectorMode;
  disabled: boolean;
  onClick: () => void;
}

function UserRow({ user, isSelected, mode, disabled, onClick }: RowProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/40",
        isSelected && mode === "group" && "bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
            {getInitials(user.nombre)}
          </AvatarFallback>
        </Avatar>
        <OnlineDot online={user.online} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{user.nombre}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {lastSeenLabel(user)}
        </p>
      </div>

      {mode === "group" && (
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            isSelected
              ? "border-primary bg-primary"
              : "border-muted-foreground/30"
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export function UserSelectorPanel({
  mode,
  selectedIds,
  onBack,
  onSelectDirect,
  onToggleUserFull,
  onNextGroup,
}: Props) {
  const [search, setSearch] = useState("");
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const setPendingDirectChat = useChatStore((s) => s.setPendingDirectChat);

  // usar el hook de mensajería en vez de useUsersInfinite
  const { users: allUsers, isLoading } = useMessagingUsersFlat(search);

  const handleUserClick = (user: MessagingUser) => {
    if (mode === "direct") {
      const chats = useChatStore.getState().chats;
      const existingChat = chats.find(
        (c) =>
          c.tipo === "DIRECT" &&
          c.participantes.some((p) => p.usuario.id === user.id)
      );

      if (existingChat) {
        setActiveChatId(existingChat.id);
      } else {
        setPendingDirectChat({ userId: user.id, nombre: user.nombre });
      }
      onSelectDirect();
    } else {
      onToggleUserFull(user);
    }
  };

  // Ordenar: online primero
  const sorted = useMemo(
    () =>
      [...allUsers].sort((a, b) => {
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        return a.nombre.localeCompare(b.nombre);
      }),
    [allUsers]
  );

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 space-y-3 border-b border-border/40 bg-background p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold">
            {mode === "direct" ? "Nuevo mensaje" : "Agregar participantes"}
          </h3>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-xl border-border/30 bg-muted/30 pl-8 text-xs focus-visible:ring-1"
          />
        </div>

        {mode === "direct" && (
          <button
            onClick={onNextGroup}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[13px] font-semibold text-primary">
              Nuevo grupo
            </span>
          </button>
        )}
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            {search ? "Sin resultados" : "Sin usuarios disponibles"}
          </div>
        ) : (
          sorted.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelected={selectedIds.includes(u.id)}
              mode={mode}
              disabled={false}
              onClick={() => handleUserClick(u)}
            />
          ))
        )}
      </div>

      {/* ── Group: botón Siguiente ─────────────────────────────────────── */}
      {mode === "group" && selectedIds.length > 0 && (
        <div className="shrink-0 border-t border-border/40 bg-background p-3">
          <Button className="h-9 w-full gap-2 text-xs" onClick={onNextGroup}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
            <span className="ml-auto rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-bold">
              {selectedIds.length}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
