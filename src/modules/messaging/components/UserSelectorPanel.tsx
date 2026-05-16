/**
 * Vista agrupada por sucursal (sin búsqueda):
 *  - Usuarios deduplicados: cada uno aparece solo UNA VEZ, en su primera sucursal
 *  - Badges de TODAS sus sucursales en cada fila → visible dónde pertenece
 *  - SucursalHeader sticky con sigla + nombre + count
 *
 * Vista plana (con búsqueda):
 *  - Lista deduplicada con todos los badges de sucursal
 *
 * Online:
 *  - Presence como fuente primaria (via resolveOnline en useMessagingUsersFlat)
 *  - HTTP como fallback si Presence no está conectado
 */
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Users,
  Check,
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import {
  useMessagingUsersFlat,
  useMessagingUsersGrouped,
  useUserAllSucursalesMap,
} from "../hooks/useMessagingUsers";
import type { MessagingUser } from "../types/MessagingUser.types";
import { useChatStore } from "../stores/ChatStore";
import { OnlineDotLive, LastSeenLabelLive } from "./PresenceIndicator";
import authSDK from "@/services/sdk-simple-auth";
import { ConversationAvatar } from "./ConversationAvatar";

export type SelectorMode = "direct" | "group";

interface Props {
  mode: SelectorMode;
  selectedIds: number[];
  onBack: () => void;
  onSelectDirect: () => void;
  onToggleUser?: (id: number) => void; // compat noop
  onToggleUserFull: (user: MessagingUser) => void;
  onNextGroup: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCURSAL BADGES — muestra todas las siglas del usuario
// ─────────────────────────────────────────────────────────────────────────────

function SucursalBadges({ siglas }: { siglas: string[] }) {
  if (!siglas.length) return null;
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {siglas.map((s) => (
        <span
          key={s}
          className="rounded px-1 py-0.5 text-[9px] font-bold bg-muted text-muted-foreground leading-none"
        >
          {s}
        </span>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ROW
// ─────────────────────────────────────────────────────────────────────────────

function UserRow({
  user,
  isSelected,
  mode,
  allSucursales,
  onClick,
}: {
  user: MessagingUser;
  isSelected: boolean;
  mode: SelectorMode;
  /** Todas las siglas de sucursal del usuario */
  allSucursales: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/40",
        isSelected && mode === "group" && "bg-primary/5"
      )}
    >
      {/* Avatar + presencia */}
      <div className="relative shrink-0">
        <ConversationAvatar
          userId={user.id}
          name={user.nombre ?? "Usuario desconocido"}
          className="size-9"
          fallbackClassName="text-xs"
        />
        <OnlineDotLive
          userId={user.id}
          lastSeenAt={user.last_seen_at}
          className="absolute -bottom-0.5 -right-0.5 size-2.5"
          httpOnline={user.online}
        />
      </div>

      {/* Datos */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-[13px] font-semibold leading-tight">
          {user.nombre}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[10px] text-muted-foreground leading-tight">
            @{user.nickname}
          </p>
          <SucursalBadges siglas={allSucursales} />
        </div>
      </div>

      <LastSeenLabelLive
        userId={user.id}
        lastSeenAt={user.last_seen_at}
        className="text-[10px]"
        httpOnline={user.online}
      />
      {/* Checkbox grupo */}
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
// SUCURSAL SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────

function SucursalHeader({
  nombre,
  sigla,
  count,
}: {
  nombre: string;
  sigla: string;
  count: number;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-3 py-1.5 border-b border-border/20">
      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-primary/10 text-primary leading-none">
        {sigla}
      </span>
      <span className="flex-1 truncate text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {nombre}
      </span>
      <span className="shrink-0 text-[10px] text-muted-foreground/50">
        {count}
      </span>
    </div>
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
  const currentUserId = authSDK.getCurrentUser()?.id;

  const isSearching = search.trim().length > 0;

  const { groups, isLoading: loadingGroups } = useMessagingUsersGrouped();
  const { users: flatSearch, isLoading: loadingFlat } = useMessagingUsersFlat(
    isSearching ? search : undefined
  );

  // Mapa de TODAS las sucursales por userId
  const allSucursalesMap = useUserAllSucursalesMap();

  const isLoading = isSearching ? loadingFlat : loadingGroups;

  // Vista agrupada: deduplicada (una vez por usuario, en su primera sucursal)
  // pero con los badges de TODAS sus sucursales
  const groupedView = useMemo(() => {
    if (isSearching) return [];

    const seen = new Set<number>();
    return groups
      .map((g) => ({
        sucursal: g.sucursal,
        usuarios: g.usuarios.filter((u) => {
          if (String(u.id) === String(currentUserId)) return false;
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        }),
      }))
      .filter((g) => g.usuarios.length > 0);
  }, [groups, isSearching, currentUserId]);

  const handleUserClick = (user: MessagingUser) => {
    if (mode === "direct") {
      const chats = useChatStore.getState().chats;
      const existing = chats.find(
        (c) =>
          c.tipo === "DIRECT" &&
          c.participantes.some((p) => p.usuario.id === user.id)
      );
      if (existing) setActiveChatId(existing.id);
      else setPendingDirectChat({ userId: user.id, nombre: user.nombre });
      onSelectDirect();
    } else {
      onToggleUserFull(user);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 space-y-2.5 border-b border-border/40 bg-background p-3">
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
            {mode === "direct" ? "Nuevo mensaje" : "Seleccionar participantes"}
          </h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Nombre o @nickname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-xl border-border/30 bg-muted/30 pl-8 pr-8 text-xs focus-visible:ring-1"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nuevo grupo — solo en modo directo sin búsqueda */}
        {mode === "direct" && !isSearching && (
          <button
            onClick={onNextGroup}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-accent/40"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[13px] font-semibold text-primary">
              Nuevo grupo
            </span>
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isSearching ? (
          /* Vista plana — resultados de búsqueda */
          flatSearch.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Sin resultados para &ldquo;{search}&rdquo;
            </div>
          ) : (
            flatSearch.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelected={selectedIds.includes(u.id)}
                mode={mode}
                allSucursales={allSucursalesMap.get(u.id) ?? []}
                onClick={() => handleUserClick(u)}
              />
            ))
          )
        ) : /* Vista agrupada — sin búsqueda */
        groupedView.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            Sin usuarios disponibles
          </div>
        ) : (
          groupedView.map((g) => (
            <div key={g.sucursal.id}>
              <SucursalHeader
                nombre={g.sucursal.nombre}
                sigla={g.sucursal.sigla}
                count={g.usuarios.length}
              />
              {g.usuarios.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isSelected={selectedIds.includes(u.id)}
                  mode={mode}
                  allSucursales={allSucursalesMap.get(u.id) ?? []}
                  onClick={() => handleUserClick(u)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Botón continuar — grupo */}
      {mode === "group" && selectedIds.length > 0 && (
        <div className="shrink-0 border-t border-border/40 bg-background p-3">
          <Button className="h-9 w-full gap-2 text-xs" onClick={onNextGroup}>
            Continuar
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
