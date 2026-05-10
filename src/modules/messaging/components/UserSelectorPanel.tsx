/**
 * Reemplaza la lista de conversaciones al crear un nuevo chat.
 * Flujo:
 *   - Modo "direct": clic en usuario → crea chat directo
 *   - Modo "group":  selección múltiple → botón "Siguiente" aparece abajo
 *
 * Usa scroll infinito: al llegar al final carga la siguiente página.
 */
import { useCallback, useMemo, useRef, useState } from "react";
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
import { useUsersInfinite } from "../hooks/useUsersInfinite";
import authSDK from "@/services/sdk-simple-auth";
import type { User } from "@/modules/users/types/User";
import { useChatStore } from "../stores/ChatStore";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SelectorMode = "direct" | "group";

interface Props {
  mode: SelectorMode;
  selectedIds: number[];
  onBack: () => void;
  onSelectDirect: () => void; // called after direct chat created
  onToggleUser: (id: number) => void; // id-only (fallback)
  onToggleUserFull: (user: User) => void; // full User object (needed for GroupSetupPanel)
  onNextGroup: () => void; // go to GroupSetupPanel or switch to group mode
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ROW
// ─────────────────────────────────────────────────────────────────────────────

interface RowProps {
  user: User;
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
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
            {getInitials(user.empleado.nombre)}
          </AvatarFallback>
        </Avatar>
        {/* online indicator = activo */}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
            user.activo ? "bg-emerald-500" : "bg-muted-foreground/30"
          )}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">
          {user.empleado.nombre}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {user.email ?? "Sin correo"}
        </p>
      </div>

      {/* Group checkbox */}
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
  // onToggleUser,
  onToggleUserFull,
  onNextGroup,
}: Props) {
  const [search, setSearch] = useState("");
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const setPendingDirectChat = useChatStore((s) => s.setPendingDirectChat);
  const currentUser = authSDK.getCurrentUser();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useUsersInfinite(search);

  const allUsers: User[] = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  );

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.id !== Number(currentUser?.id) &&
        (u.empleado.nombre.toLowerCase().includes(lower) ||
          (u.email ?? "").toLowerCase().includes(lower))
    );
  }, [allUsers, search, currentUser]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const attachSentinel = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0]?.isIntersecting &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            void fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleUserClick = (user: User) => {
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
        setPendingDirectChat({ userId: user.id, nombre: user.empleado.nombre });
      }
      onSelectDirect();
    } else {
      onToggleUserFull(user);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ───────────────────────────────────────────────────── */}
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

        {/* Search */}
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

        {/* Group mode: "Nuevo grupo" link — only shown in direct mode */}
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

      {/* ── List (scrollable) ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            {search ? "Sin resultados" : "Sin usuarios disponibles"}
          </div>
        ) : (
          <>
            {filtered.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelected={selectedIds.includes(u.id)}
                mode={mode}
                disabled={false}
                onClick={() => handleUserClick(u)}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={attachSentinel} className="py-2 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Group: "Siguiente" button ──────────────────────────────── */}
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
