import { SidebarInset, SidebarProvider } from '@/components/atoms/sidebar';
import TabBar from '@/components/tabs/TabBar';
import TabContainer from '@/components/tabs/TabContainer';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useCommands } from '@/keybindings';
import CartSidebar from '@/modules/shoppingCart/components/CartSidebar';
import { useCartUiStore } from '@/modules/shoppingCart/store/cartUiStore';
import { useEffect, useState } from 'react';
import AppSidebar from './appSidebar';
import TopNav from './top-nav';

export default function Layout() {
  const { isOpen, close, toggle,
    // open 
  } = useCartUiStore();
  const [mounted, setMounted] = useState(false);
  const { nextTab, previousTab, closeCurrentTab,
    // tabs 
  } = useTabNavigation();

  useCommands({
    'tabs.next': nextTab,
    'tabs.previous': previousTab,
    'tabs.close': closeCurrentTab
  })
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 flex flex-col h-screen">
        <header className="border-b border-border sticky top-0 z-10 bg-background flex-shrink-0">
          <div className="h-16">
            <TopNav onOpenCartChange={toggle} />
          </div>
          <TabBar onCloseTab={closeCurrentTab} />
        </header>
        <div
          id="main-scroll-container"
          className="flex-1 bg-gray-50 overflow-auto"
        >
          <TabContainer />
        </div>
      </SidebarInset>
      <CartSidebar open={isOpen} onOpenChange={close} />
    </SidebarProvider>
  );
}
