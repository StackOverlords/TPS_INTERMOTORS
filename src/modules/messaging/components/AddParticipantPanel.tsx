/**
 *  - Indicador de presencia online en tiempo real
 *  - Sin scroll infinito (el endpoint devuelve todos de una vez)
 */
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";
import { useAddParticipant, useParticipants } from "../hooks/useParticipants";
import { useMessagingUsersFlat } from "../hooks/useMessagingUsers";
import authSDK from "@/services/sdk-simple-auth";
import type { MessagingUser } from "../types/MessagingUser.types";
import { getInitials } from "../utils/chatUtils";

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

  const { users: allUsers, isLoading } = useMessagingUsersFlat(search);

  // IDs ya participantes (para filtrar)
  const participantUserIds = useMemo(
    () => new Set(currentParticipants.map((p) => p.usuario.id)),
    [currentParticipants]
  );

  // Excluir participantes actuales y al usuario autenticado
  const filtered = useMemo(
    () =>
      allUsers.filter(
        (u) => u.id !== Number(currentUser?.id) && !participantUserIds.has(u.id)
      ),
    [allUsers, currentUser, participantUserIds]
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
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {search
              ? "Sin resultados"
              : "Todos los usuarios ya son participantes"}
          </p>
        ) : (
          filtered.map((u) => {
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
                {/* Avatar con indicador online */}
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                      {getInitials(u.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                      u.online ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{u.nombre}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {u.nickname}
                  </p>
                </div>

                {wasJustAdded ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : addParticipant.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
