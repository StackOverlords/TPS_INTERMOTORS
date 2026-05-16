/**
 *  - Indicador de presencia online en tiempo real
 *  - Sin scroll infinito (el endpoint devuelve todos de una vez)
 */
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { cn } from "@/lib/utils";
import { useAddParticipant, useParticipants } from "../hooks/useParticipants";
import {
  useMessagingUsersFlat,
  useMessagingUsersGrouped,
  useUserAllSucursalesMap,
} from "../hooks/useMessagingUsers";
import authSDK from "@/services/sdk-simple-auth";
import type { MessagingUser } from "../types/MessagingUser.types";
import { ConversationAvatar } from "./ConversationAvatar";
import { OnlineDotLive } from "./PresenceIndicator";

interface Props {
  chatId: number;
  onBack: () => void;
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
  allSucursales,
  onClick,
  isPending,
  wasJustAdded,
}: {
  user: MessagingUser;
  /** Todas las siglas de sucursal del usuario */
  allSucursales: string[];
  onClick: () => void;
  isPending?: boolean;
  wasJustAdded?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/40",
        wasJustAdded && "bg-emerald-500/10",
        isPending && "opacity-60 cursor-not-allowed"
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
          httpOnline={user.online}
          lastSeenAt={user.last_seen_at}
          className="absolute -bottom-0.5 -right-0.5 size-2.5"
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

      {wasJustAdded ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : isPending ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : null}
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

export function AddParticipantPanel({ chatId, onBack }: Props) {
  const [search, setSearch] = useState("");
  const [justAdded, setJustAdded] = useState<number | null>(null);

  const addParticipant = useAddParticipant(chatId);
  const { data: currentParticipants = [] } = useParticipants(chatId);
  const currentUserId = authSDK.getCurrentUser()?.id;

  const isSearching = search.trim().length > 0;

  const { groups, isLoading: loadingGroups } = useMessagingUsersGrouped();
  const { users: flatSearch, isLoading: loadingFlat } = useMessagingUsersFlat();

  // Mapa de TODAS las sucursales por userId
  const allSucursalesMap = useUserAllSucursalesMap();

  const isLoading = isSearching ? loadingFlat : loadingGroups;

  // IDs ya participantes (para filtrar)
  const participantUserIds = useMemo(
    () => new Set(currentParticipants.map((p) => p.usuario.id)),
    [currentParticipants]
  );

  //Excluir participantes actuales y al usuario autenticado, vista agrupada, sin búsqueda
  const groupedViewFiltered = useMemo(() => {
    if (isSearching) return [];

    const seen = new Set<number>();
    return groups
      .map((g) => ({
        sucursal: g.sucursal,
        usuarios: g.usuarios.filter((u) => {
          if (String(u.id) === String(currentUserId)) return false;
          if (participantUserIds.has(u.id)) return false;
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        }),
      }))
      .filter((g) => g.usuarios.length > 0);
  }, [groups, isSearching, currentUserId, participantUserIds]);

  // Excluir participantes actuales y al usuario autenticado
  const filtered = useMemo(
    () =>
      flatSearch.filter(
        (u) =>
          u.id !== Number(currentUserId) &&
          !participantUserIds.has(u.id) &&
          u.nombre.toLowerCase().includes(search.toLowerCase())
      ),
    [flatSearch, currentUserId, participantUserIds, search]
  );

  const handleAdd = (user: MessagingUser) => {
    addParticipant.mutate(
      { usuario_id: user.id },
      {
        onSuccess: () => {
          setJustAdded(user.id);
          setTimeout(onBack, 900);
        },
      }
    );
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
          <h3 className="text-sm font-semibold">Agregar participante</h3>
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
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isSearching ? (
          filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {search
                ? "Sin resultados"
                : "Todos los usuarios ya son participantes"}
            </p>
          ) : (
            filtered.map((u) => {
              const wasJustAdded = justAdded === u.id;
              return (
                <UserRow
                  key={u.id}
                  user={u}
                  allSucursales={allSucursalesMap.get(u.id) ?? []}
                  onClick={() => handleAdd(u)}
                  isPending={addParticipant.isPending}
                  wasJustAdded={wasJustAdded}
                />
              );
            })
          )
        ) : /* Vista agrupada — sin búsqueda */
        groupedViewFiltered.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            Sin usuarios disponibles
          </div>
        ) : (
          groupedViewFiltered.map((g) => (
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
                  allSucursales={allSucursalesMap.get(u.id) ?? []}
                  onClick={() => handleAdd(u)}
                  isPending={addParticipant.isPending}
                  wasJustAdded={justAdded === u.id}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
