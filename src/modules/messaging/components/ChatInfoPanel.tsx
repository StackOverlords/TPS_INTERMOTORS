import { useState } from "react";
import {
  X,
  BellOff,
  Crown,
  Shield,
  User,
  UserPlus,
  UserMinus,
  LogOut,
  AlertCircle,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { Separator } from "@/components/atoms/separator";
import { Input } from "@/components/atoms/input";
import {
  useParticipants,
  useRemoveParticipant,
  useLeaveChat,
} from "../hooks/useParticipants";
import { AddParticipantPanel } from "./AddParticipantPanel";
import authSDK from "@/services/sdk-simple-auth";
import type { Chat, ParticipantRole } from "../types/Chat.types";
import { sortParticipantsByRole } from "../utils/chatUtils";
import { ConversationAvatar } from "./ConversationAvatar";
import { useEditChat } from "../hooks/useEditChat";
import { OnlineDot, LastSeenLabel } from "./PresenceIndicator";
import {
  useMessagingUserMap,
  useUserAllSucursalesMap,
} from "../hooks/useMessagingUsers";
import { useIsOnline, usePresenceStore } from "../stores/PresenceStore";
import type { MessagingUser } from "../types/MessagingUser.types";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_ICONS: Record<ParticipantRole, React.ReactNode> = {
  OWNER: (
    <Badge variant="success" className="gap-1 text-[10px] px-1.5 py-0">
      <Crown className="h-3 w-3 text-amber-500" />
      Propietario
    </Badge>
  ),
  ADMIN: (
    <Badge variant="accent" className="gap-1 text-[10px] px-1.5 py-0">
      <Shield className="h-3 w-3" />
      Admin
    </Badge>
  ),
  MEMBER: (
    <Badge variant="warning" className="gap-1 text-[10px] px-1.5 py-0">
      <User className="h-3 w-3" />
      Miembro
    </Badge>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT ROW
// Componente separado para poder llamar hooks (useIsOnline) correctamente.
// ─────────────────────────────────────────────────────────────────────────────

interface ParticipantRowProps {
  p: ReturnType<typeof sortParticipantsByRole>[number];
  isMe: boolean;
  canRemove: boolean;
  onRemove: () => void;
  isRemoving: boolean;
  /** Datos del usuario desde /messaging/users (puede ser undefined para el propio usuario) */
  messagingUser: MessagingUser | undefined;
  /** Siglas de TODAS las sucursales del participante */
  allSucursales: string[];
}

function ParticipantRow({
  p,
  isMe,
  canRemove,
  onRemove,
  isRemoving,
  messagingUser,
  allSucursales,
}: ParticipantRowProps) {
  const presenceOnline = useIsOnline(p.usuario.id);
  const presenceConnected = usePresenceStore((s) => s.presenceConnected);

  /**
   * Fuente de verdad:
   *  - Presence conectado → usar SOLO el Set de presencia (ignora HTTP)
   *  - Presence no conectado → usar campo online del HTTP
   *
   * Para el usuario autenticado (isMe), messagingUser puede ser undefined
   * porque el backend lo excluye del endpoint /messaging/users.
   * En ese caso, presenceOnline (del PresenceStore) es la única fuente.
   */
  const online = presenceConnected
    ? presenceOnline
    : (messagingUser?.online ?? presenceOnline);

  const lastSeen = messagingUser?.last_seen_at ?? null;

  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/40">
      {/* Avatar + OnlineDot */}
      <div className="relative shrink-0">
        <ConversationAvatar
          userId={p.usuario.id}
          name={p.usuario?.nombre ?? "Usuario"}
          isGroup={false}
          className="size-8"
          fallbackClassName="text-xs"
          iconClassName="h-7 w-7"
        />
        <OnlineDot
          online={online}
          lastSeenAt={lastSeen}
          className="absolute -bottom-0.5 -right-0.5 size-2.5"
        />
      </div>

      {/* Nombre + last seen */}
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium leading-tight">
            {p.usuario?.nombre ?? "Usuario desconocido"}
            {isMe && (
              <span className="ml-1 text-muted-foreground font-normal">
                (Tú)
              </span>
            )}
          </p>
        </div>

        {/* LastSeenLabel reemplaza la línea de rol repetida */}
        <LastSeenLabel
          online={online}
          lastSeenAt={lastSeen}
          className="text-[10px]"
        />
      </div>

      {/* Rol badge + botón remover */}
      <div className="flex shrink-0 items-center gap-1.5">
        <div>
          {ROLE_ICONS[p.rol]}
          {/* Sucursal badges */}
          {allSucursales.length > 0 && (
            <div className="flex gap-0.5 mt-0.5">
              {allSucursales.map((s) => (
                <span
                  key={s}
                  className="rounded px-1 py-0.5 text-[9px] font-bold bg-muted text-muted-foreground leading-none"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {canRemove && (
          <Button
            variant="secondary"
            size="icon"
            className="text-destructive cursor-pointer hover:bg-destructive/10"
            disabled={isRemoving}
            onClick={onRemove}
            title={`Remover a ${p.usuario?.nombre}`}
          >
            <UserMinus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS / VIEW TYPE
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  chat: Chat;
  onClose: () => void;
}

type PanelView = "info" | "add-member" | "edit-group";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ChatInfoPanel({ chat, onClose }: Props) {
  const [view, setView] = useState<PanelView>("info");
  const [editNombre, setEditNombre] = useState(chat.nombre);
  const [editDescripcion, setEditDescripcion] = useState(
    chat.descripcion ?? ""
  );

  const { data: participants = [], isLoading } = useParticipants(chat.id);
  const removeParticipant = useRemoveParticipant(chat.id);
  const leaveChat = useLeaveChat(chat.id);
  const editChat = useEditChat(chat.id);

  // Mapas de presencia y sucursales
  const userMap = useMessagingUserMap();
  const allSucursalesMap = useUserAllSucursalesMap();

  const isGroup = chat.tipo !== "DIRECT";
  const isSistema = chat.es_sistema;
  const myRole = chat.mi_participacion.rol;
  const canManage = (myRole === "OWNER" || myRole === "ADMIN") && !isSistema;
  const currentUserId = Number(authSDK.getCurrentUser()?.id);
  const sortedParticipants = sortParticipantsByRole(participants);

  const handleLeave = () => {
    leaveChat.mutate();
    onClose();
  };

  // ── Edit group view ────────────────────────────────────────────────────────
  if (view === "edit-group") {
    const handleSave = () => {
      const nombre = editNombre.trim();
      if (!nombre) return;
      editChat.mutate(
        { nombre, descripcion: editDescripcion.trim() || undefined },
        { onSuccess: () => setView("info") }
      );
    };

    return (
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-2">
          <span className="text-sm font-semibold">Editar grupo</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setView("info")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nombre <span className="text-destructive">*</span>
            </label>
            <Input
              autoFocus
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              maxLength={100}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descripción
            </label>
            <Input
              value={editDescripcion}
              onChange={(e) => setEditDescripcion(e.target.value)}
              maxLength={255}
              placeholder="Opcional"
              className="h-9 text-sm"
            />
          </div>
        </div>
        <div className="shrink-0 border-t border-border/50 bg-background p-3 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setView("info")}
            disabled={editChat.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-1"
            disabled={!editNombre.trim() || editChat.isPending}
            onClick={handleSave}
          >
            <Check className="h-3.5 w-3.5" />
            Guardar
          </Button>
        </div>
      </div>
    );
  }

  // ── Add member view ────────────────────────────────────────────────────────
  if (view === "add-member") {
    return (
      <div className="flex h-full flex-col">
        <AddParticipantPanel chatId={chat.id} onBack={() => setView("info")} />
      </div>
    );
  }

  // ── Info view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-2">
        <span className="text-sm font-semibold">
          {isGroup ? "Info. del grupo" : "Info. del chat"}
        </span>
        <div className="flex items-center gap-1">
          {canManage && isGroup && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              title="Editar grupo"
              onClick={() => {
                setEditNombre(chat.nombre);
                setEditDescripcion(chat.descripcion ?? "");
                setView("edit-group");
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 p-4">
          {/* Avatar + datos del chat */}
          <div className="space-y-2 text-center">
            <ConversationAvatar
              name={chat.nombre}
              isGroup={isGroup}
              className="mx-auto h-16 w-16"
              fallbackClassName="text-lg"
              iconClassName="h-7 w-7"
            />
            <div>
              <h4 className="text-sm font-semibold">{chat.nombre}</h4>
              {chat.descripcion && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {chat.descripcion}
                </p>
              )}
              {isGroup && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {chat.participantes.length} participante
                  {chat.participantes.length !== 1 ? "s" : ""}
                </p>
              )}
              {isSistema && (
                <Badge variant="outline" className="mt-1.5 text-[10px]">
                  Canal del sistema
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Mi participación */}
          {isGroup && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mi participación
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-xs text-muted-foreground">Rol:</span>
                {ROLE_ICONS[myRole]}
                {chat.mi_participacion.silenciado && (
                  <Badge
                    variant="outline"
                    className="ml-auto h-4 px-1 text-[10px]"
                  >
                    <BellOff className="mr-1 h-2.5 w-2.5" /> Silenciado
                  </Badge>
                )}
              </div>
              {!chat.mi_participacion.puede_escribir && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-[10px] text-amber-600">
                    Solo lectura — no puedes enviar mensajes
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Participantes */}
          {isGroup && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Participantes ({sortedParticipants.length})
                  </p>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setView("add-member")}
                      className="cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {isSistema && (
                  <p className="px-1 text-[10px] italic text-muted-foreground">
                    Los participantes son gestionados automáticamente.
                  </p>
                )}

                {isLoading ? (
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-lg bg-muted/40"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {sortedParticipants.map((p) => {
                      const isMe = p.usuario.id === currentUserId;
                      const canRemove =
                        canManage &&
                        !isMe &&
                        !(
                          myRole === "ADMIN" &&
                          (p.rol === "OWNER" || p.rol === "ADMIN")
                        );

                      return (
                        <ParticipantRow
                          key={p.id}
                          p={p}
                          isMe={isMe}
                          canRemove={canRemove}
                          onRemove={() =>
                            removeParticipant.mutate(p.usuario.id)
                          }
                          isRemoving={removeParticipant.isPending}
                          messagingUser={userMap.get(p.usuario.id)}
                          allSucursales={
                            allSucursalesMap.get(p.usuario.id) ?? []
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {isGroup && !isSistema && myRole !== "OWNER" && (
        <div className="shrink-0 border-t border-border/50 bg-background p-3">
          <Button
            variant="outline"
            className="w-full gap-2 text-xs text-destructive hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
            disabled={leaveChat.isPending}
            onClick={handleLeave}
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir del grupo
          </Button>
        </div>
      )}
    </div>
  );
}
