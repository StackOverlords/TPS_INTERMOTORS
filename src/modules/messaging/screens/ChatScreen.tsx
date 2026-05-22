/**
 *
 *   ┌──────────────┬─────────────────────────┐
 *   │ ConversationList (300px fijo)           │
 *   │  · lista de chats                      │
 *   │  · se transforma en UserSelectorPanel  │
 *   │    o GroupSetupPanel al crear chat      │
 *   ├──────────────┼────────────────────────  │
 *   │              │ ChatConversation flex-1  │
 *   │              │ · ChatInfoPanel aparece  │
 *   │              │   como columna derecha   │
 *   └──────────────┴─────────────────────────┘
 *
 * Solo los scrolls internos de cada panel se desplazan.
 * El layout en sí es completamente estático (overflow-hidden).
 */
import { useEffect } from "react";
import { Loader2, MessagesSquare } from "lucide-react";
import { useChats } from "../hooks/useChats";
import { useChatStore } from "../stores/ChatStore";
import { useChatUIStore } from "../stores/ChatUiStore";
import { ConversationList } from "../components/ConversationList";
import { ChatConversation } from "../components/ChatConversation";
export default function ChatScreen() {
  const { isLoading } = useChats();
  const activeChatId = useChatStore((s) => s.activeChatId);
  const pendingDirectChat = useChatStore((s) => s.pendingDirectChat);
  const { isOpen, close } = useChatUIStore();

  useEffect(() => {
    if (isOpen) close();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden rounded-lg border border-border bg-background">
      {/* ── Sidebar izquierdo (lista / selector / setup) ──────────────── */}
      {/* w-[380px] fijo — no se colapsa en pantalla completa */}
      <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-border/50">
        <ConversationList />
      </aside>

      {/* ── Panel principal — ChatConversation ocupa el resto ─────────── */}
      {/* compact={false} → ChatInfoPanel aparecerá como columna lateral  */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {activeChatId || pendingDirectChat ? (
          <ChatConversation compact={false} showBackButton />
        ) : (
          <EmptyPanel />
        )}
      </main>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-muted/30">
        <MessagesSquare className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div>
        <p className="font-medium text-muted-foreground">
          Selecciona una conversación
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground/60">
          Elige un chat de la lista o crea uno nuevo
        </p>
      </div>
    </div>
  );
}
