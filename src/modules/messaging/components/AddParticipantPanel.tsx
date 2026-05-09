/**
 * AddParticipantPanel.tsx
 *
 * Panel inline para agregar un participante a un grupo existente.
 * Reemplaza el contenido del ChatInfoPanel sin abrir modal.
 *
 * - Scroll infinito de usuarios (misma lógica que UserSelectorPanel)
 * - Filtra los que ya son participantes del grupo
 * - Agrega uno a la vez (a futuro: selección múltiple)
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";
import { useAddParticipant, useParticipants } from "../hooks/useParticipants";
import { useUsersInfinite } from "../hooks/useUsersInfinite";
import authSDK from "@/services/sdk-simple-auth";
import type { User } from "@/modules/users/types/User";

function getInitials(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface Props {
  chatId: number;
  onBack: () => void;
}

export function AddParticipantPanel({ chatId, onBack }: Props) {
  const [search, setSearch] = useState("");
  const [justAdded, setJustAdded] = useState<number | null>(null);

  const addParticipant = useAddParticipant(chatId);
  const { data: currentParticipants = [] } = useParticipants(chatId);
  const currentUser = authSDK.getCurrentUser();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useUsersInfinite(search);

  // IDs ya participantes (para filtrar)
  const participantUserIds = useMemo(
    () => new Set(currentParticipants.map((p) => p.usuario.id)),
    [currentParticipants]
  );

  const allUsers: User[] = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  );

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.id !== Number(currentUser?.id) &&
        !participantUserIds.has(u.id) &&
        (u.empleado.nombre.toLowerCase().includes(lower) ||
          (u.email ?? "").toLowerCase().includes(lower))
    );
  }, [allUsers, search, currentUser, participantUserIds]);

  // Infinite scroll sentinel
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

  const handleAdd = (user: User) => {
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
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {search
              ? "Sin resultados"
              : "Todos los usuarios ya son participantes"}
          </p>
        ) : (
          <>
            {filtered.map((u) => {
              const wasJustAdded = justAdded === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => handleAdd(u)}
                  disabled={addParticipant.isPending}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/40",
                    wasJustAdded && "bg-emerald-500/10",
                    addParticipant.isPending && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                      {getInitials(u.empleado.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {u.empleado.nombre}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {u.email ?? "Sin correo"}
                    </p>
                  </div>
                  {wasJustAdded ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : addParticipant.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                  ) : null}
                </button>
              );
            })}
            <div ref={attachSentinel} className="flex justify-center py-2">
              {isFetchingNextPage && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
