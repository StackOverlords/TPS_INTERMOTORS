import { SidebarInset, SidebarProvider } from "@/components/atoms/sidebar";
// import TabBar from "@/components/tabs/TabBar";
import TabContainer from "@/components/tabs/TabContainer";
// import { useTabNavigation } from "@/hooks/useTabNavigation";
// import { useCommands } from "@/keybindings";
import CartSidebar from "@/modules/shoppingCart/components/CartSidebar";
import { useCartUiStore } from "@/modules/shoppingCart/store/cartUiStore";
import { useEffect, useState } from "react";
import AppSidebar from "./appSidebar";
import TopNav from "./top-nav";

export default function Layout() {
  const {
    isOpen,
    close,
    toggle,
    // open
  } = useCartUiStore();
  const [mounted, setMounted] = useState(false);
  // const {
  //   nextTab,
  //   previousTab,
  //   closeCurrentTab,
  //   // tabs
  // } = useTabNavigation();

  // useCommands(
  //   {
  //     "tabs.next": nextTab,
  //     "tabs.previous": previousTab,
  //     "tabs.close": closeCurrentTab,
  //   },
  //   {
  //     enableOnFormTags: true,
  //   }
  // );
  useEffect(() => {
    setMounted(true);
  }, []);

  // useHotkeys(
  //   'alt+c',
  //   () => {
  //     if (!isOpen) open();
  //   },
  //   {
  //     enabled: !isOpen,
  //   }
  // );

  if (!mounted) {
    return null;
  }

  return (
    <SidebarProvider className="h-full w-full flex overflow-hidden relative min-h-0">
      <AppSidebar />
      <SidebarInset className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
        <header className="border-b border-border bg-background flex-shrink-0">
          <div className="h-16">
            <TopNav onOpenCartChange={toggle} />
          </div>
          {/* <TabBar onCloseTab={closeCurrentTab} /> */}
        </header>
        <div
          id="main-scroll-container"
          className="bg-secondary flex-1 min-h-0 overflow-hidden"
        >
          <TabContainer />
        </div>
      </SidebarInset>
      <CartSidebar open={isOpen} onOpenChange={close} />
    </SidebarProvider>
  );
}
