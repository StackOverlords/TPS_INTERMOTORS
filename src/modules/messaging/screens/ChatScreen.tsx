/**
 * ChatScreen.tsx — Pantalla completa de chat
 *
 * Ruta sugerida: /chat
 *
 * Layout estático (sin scroll de página):
 *  - Sidebar izquierdo: lista de conversaciones
 *  - Panel derecho: mensajes del chat activo
 *  - Solo las áreas internas hacen scroll
 */

import { useChats } from "../hooks/useChats";
import { ConversationList } from "../components/ConversationList";
import { ChatConversation } from "../components/ChatConversation";
import { Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "../stores/ChatStore";

export default function ChatScreen() {
  const { isLoading } = useChats();
  const activeChatId = useChatStore((s) => s.activeChatId);

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
    /*
     * h-full → fills the layout container (same pattern as SalesListScreen)
     * flex → horizontal split: sidebar | main
     * overflow-hidden → prevents page-level scroll
     */
    <div className="flex h-full overflow-hidden rounded-lg border border-border bg-background">
      {/* ── Sidebar — fixed width, full height, only internal scroll ── */}
      <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-border/50">
        <ConversationList />
      </aside>

      {/* ── Main panel — fills remaining space ── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {activeChatId ? <ChatConversation /> : <EmptyPanel />}
      </main>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-muted/30">
        <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
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
