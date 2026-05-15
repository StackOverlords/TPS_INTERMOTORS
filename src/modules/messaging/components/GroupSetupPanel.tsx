/**
 * - MessagingUser (u.nombre, u.nickname)
 * - Badge de TODAS las sucursales de cada usuario seleccionado
 */
import { useState } from "react";
import { ArrowLeft, Users, X, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { useCreateGroup } from "../hooks/useCreateChat";
import type { MessagingUser } from "../types/MessagingUser.types";
import { useBranchStore } from "@/states/branchStore";
import { getInitials } from "../utils/chatUtils";
import { OnlineDot } from "./PresenceIndicator";
import { useUserAllSucursalesMap } from "../hooks/useMessagingUsers";

interface Props {
  selectedUsers: MessagingUser[];
  onBack: () => void;
  onRemoveUser: (id: number) => void;
  onSuccess: () => void;
}

export function GroupSetupPanel({
  selectedUsers,
  onBack,
  onRemoveUser,
  onSuccess,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const createGroup = useCreateGroup();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const allSucursalesMap = useUserAllSucursalesMap();

  const handleCreate = () => {
    if (!nombre.trim() || selectedUsers.length < 1) return;
    createGroup.mutate(
      {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        sucursal: Number(selectedBranchId) || 1,
        participantes: selectedUsers.map((u) => u.id),
      },
      { onSuccess }
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border/40 bg-background p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold">Nuevo grupo</h3>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-4">
          {/* Ícono */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nombre del grupo <span className="text-destructive">*</span>
            </label>
            <Input
              autoFocus
              placeholder="Ej: Equipo almacén"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-9 text-sm"
              maxLength={100}
            />
            <p className="text-right text-[10px] text-muted-foreground/60">
              {nombre.length}/100
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descripción
            </label>
            <Input
              placeholder="Opcional"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="h-9 text-sm"
              maxLength={255}
            />
          </div>

          {/* Participantes */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Participantes ({selectedUsers.length})
            </p>
            <div className="rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30">
              {selectedUsers.map((u) => {
                const siglas = allSucursalesMap.get(u.id) ?? [];
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-[11px] text-muted-foreground">
                          {getInitials(u.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineDot
                        online={u.online}
                        lastSeenAt={u.last_seen_at}
                        className="absolute -bottom-0.5 -right-0.5 size-2"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-tight">
                        {u.nombre}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[10px] text-muted-foreground">
                          @{u.nickname}
                        </p>
                        {siglas.length > 0 && (
                          <span className="flex gap-0.5">
                            {siglas.map((s) => (
                              <span
                                key={s}
                                className="rounded px-1 py-0.5 text-[9px] font-bold bg-muted text-muted-foreground leading-none"
                              >
                                {s}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveUser(u.id)}
                      className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Crear */}
      <div className="shrink-0 border-t border-border/40 bg-background p-3">
        <Button
          className="h-10 w-full gap-2 text-sm"
          disabled={
            !nombre.trim() || selectedUsers.length < 1 || createGroup.isPending
          }
          onClick={handleCreate}
        >
          {createGroup.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          Crear grupo
        </Button>
      </div>
    </div>
  );
}
