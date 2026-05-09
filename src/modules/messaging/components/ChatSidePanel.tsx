import { X, ExternalLink, MessagesSquare } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { ConversationList } from "./ConversationList";
import { ChatConversation } from "./ChatConversation";
import { useChatUIStore } from "../stores/ChatUiStore";
import { selectTotalUnread, useChatStore } from "../stores/ChatStore";

export function ChatSidePanel() {
  const { isOpen, viewMode, close, setViewMode } = useChatUIStore();
  const activeChatId = useChatStore((s) => s.activeChatId);
  const totalUnread = useChatStore(selectTotalUnread);

  if (!isOpen || viewMode !== "side") return null;

  return (
    /* w-[360px] shrink-0 so it doesn't compress the main content */
    <div className="flex h-full w-[360px] shrink-0 flex-col border-l border-border/50 bg-background">
      {/* Header — always visible, never scrolls */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-2 h-16">
        <div className="flex items-center gap-2">
          <MessagesSquare className="size-5 text-primary" />
          <span className="text-sm font-semibold">Chat interno</span>
          {totalUnread > 0 && (
            <Badge className="h-4 min-w-4 border-0 bg-primary px-1 text-[10px] text-primary-foreground">
              {totalUnread}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("floating")}
              >
                <ExternalLink className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Ventana flotante</TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-destructive"
            onClick={close}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Body — flex-1, overflow handled internally by each sub-component */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {!activeChatId ? (
          <ConversationList />
        ) : (
          <ChatConversation showBackButton />
        )}
      </div>
    </div>
  );
}
