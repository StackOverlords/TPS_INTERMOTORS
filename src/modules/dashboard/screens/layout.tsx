import { SidebarInset, SidebarProvider } from "@/components/atoms/sidebar";
import TabContainer from "@/components/tabs/TabContainer";
import CartSidebar from "@/modules/shoppingCart/components/CartSidebar";
import { useCartUiStore } from "@/modules/shoppingCart/store/cartUiStore";
import { MessagingProvider } from "@/modules/messaging/hooks/MessagingProvider";
import { ChatFloatingWindow } from "@/modules/messaging/components/ChatFloatingWindow";
import { ChatSidePanel } from "@/modules/messaging/components/ChatSidePanel";
import { useEffect, useState } from "react";
import AppSidebar from "./appSidebar";
import TopNav from "./top-nav";
import { useChatUIStore } from "@/modules/messaging/stores/ChatUiStore";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

export default function Layout() {
  const { isOpen, close, toggle } = useCartUiStore();
  const chatViewMode = useChatUIStore((s) => s.viewMode);
  const chatIsOpen = useChatUIStore((s) => s.isOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const showSidePanel = chatIsOpen && chatViewMode === "side";

  return (
    <WebSocketProvider>
      {/* // MessagingProvider envuelve todo el layout autenticado. // Se monta con
      el primer render protegido y se desmonta con logout. */}
      <MessagingProvider>
        {/* Floating chat window — posición fixed, no afecta el layout */}
        <ChatFloatingWindow />

        <SidebarProvider className="h-full w-full flex overflow-hidden relative min-h-0">
          <AppSidebar />

          {/* Main content + side panel chat en el mismo flex row */}
          <div className="flex flex-1 min-w-0 overflow-hidden">
            <SidebarInset className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
              <header className="border-b border-border bg-background flex-shrink-0">
                <div className="h-16">
                  <TopNav onOpenCartChange={toggle} />
                </div>
              </header>
              <div
                id="main-scroll-container"
                className="bg-secondary flex-1 min-h-0 overflow-hidden"
              >
                <TabContainer />
              </div>
            </SidebarInset>

            {/* Panel lateral de chat — aparece a la derecha del contenido principal */}
            {showSidePanel && <ChatSidePanel />}
          </div>

          <CartSidebar open={isOpen} onOpenChange={close} />
        </SidebarProvider>
      </MessagingProvider>
    </WebSocketProvider>
  );
}
