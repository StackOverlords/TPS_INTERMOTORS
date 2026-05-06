import { X, Users, BellOff, Crown, Shield, User } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { Badge } from "@/components/atoms/badge";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { Separator } from "@/components/atoms/separator";
import { cn } from "@/lib/utils";
import { useParticipants } from "../hooks/useParticipants";
import type { Chat, ParticipantRole } from "../types/Chat.types";
import { getInitials } from "../mocks/ChatMockUsers";

const ROLE_ICONS: Record<ParticipantRole, React.ReactNode> = {
  OWNER: <Crown className="h-3 w-3 text-amber-500" />,
  ADMIN: <Shield className="h-3 w-3 text-blue-500" />,
  MEMBER: <User className="h-3 w-3 text-muted-foreground" />,
};

const ROLE_LABELS: Record<ParticipantRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Admin",
  MEMBER: "Miembro",
};

interface Props {
  chat: Chat;
  onClose: () => void;
}

export function ChatInfoPanel({ chat, onClose }: Props) {
  const { data: participants = [], isLoading } = useParticipants(chat.id);
  const isGroup = chat.tipo === "GROUP" || chat.tipo === "CHANNEL";

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col border-l border-border/50 bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-2">
        <span className="text-xs font-semibold">Información</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Avatar + name */}
          <div className="space-y-2 text-center">
            <Avatar className="mx-auto h-16 w-16">
              <AvatarFallback
                className={cn(
                  "text-lg font-semibold",
                  isGroup
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isGroup ? (
                  <Users className="h-7 w-7" />
                ) : (
                  getInitials(chat.nombre)
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-sm font-semibold">{chat.nombre}</h4>
              {chat.descripcion && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {chat.descripcion}
                </p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {chat.participantes.length} participante
                {chat.participantes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <Separator />

          {/* My participation info */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mi participación
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-[11px] text-muted-foreground">Rol:</span>
              <div className="flex items-center gap-1">
                {ROLE_ICONS[chat.mi_participacion.rol]}
                <span className="text-[11px] font-medium">
                  {ROLE_LABELS[chat.mi_participacion.rol]}
                </span>
              </div>
              {chat.mi_participacion.silenciado && (
                <Badge
                  variant="outline"
                  className="ml-auto h-4 px-1 text-[9px]"
                >
                  <BellOff className="mr-1 h-2.5 w-2.5" /> Silenciado
                </Badge>
              )}
            </div>
            {!chat.mi_participacion.puede_escribir && (
              <p className="text-center text-[10px] text-muted-foreground italic">
                Solo lectura — no puedes enviar mensajes
              </p>
            )}
          </div>

          {/* Participants */}
          {isGroup && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Participantes ({participants.length})
                </p>
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
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/40"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                            {getInitials(p.nombre)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium">
                            {p.nombre}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.email}
                          </p>
                        </div>
                        <div className="shrink-0">{ROLE_ICONS[p.rol]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
