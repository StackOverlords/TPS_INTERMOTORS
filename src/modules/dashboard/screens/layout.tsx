import { SidebarInset, SidebarProvider } from '@/components/atoms/sidebar';
import TabBar from '@/components/tabs/TabBar';
import TabContainer from '@/components/tabs/TabContainer';
import { useTabBarKeybindings } from '@/hooks/keyBindings/useTabBarKeyBindings';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import CartSidebar from '@/modules/shoppingCart/components/CartSidebar';
import { useCartUiStore } from '@/modules/shoppingCart/store/cartUiStore';
import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import AppSidebar from './appSidebar';
import TopNav from './top-nav';

export default function Layout() {
  const { isOpen, close, toggle, open } = useCartUiStore();
  const [mounted, setMounted] = useState(false);
  const { nextTab, previousTab, closeCurrentTab, tabs } = useTabNavigation();

  const { formRef } = useTabBarKeybindings({
    previousTab: previousTab,
    nextTab: nextTab,
    closeCurrentTab: closeCurrentTab,
    canCloseCurrentTab: tabs.length > 1, // Solo permitir cerrar si hay más de 1 tab
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useHotkeys(
    'alt+c',
    () => {
      if (!isOpen) open();
    },
    {
      enabled: !isOpen,
    }
  );

  // // Atajos de teclado para tabs
  // useHotkeys('ctrl+t', e => {
  //   e.preventDefault();
  //   console.log("first")
  //   // El dashboard se abrirá automáticamente por el hook
  //   // window.location.hash = '#/dashboard';
  // });

  // useHotkeys('ctrl+w', e => {
  //   e.preventDefault();
  //   closeCurrentTab();
  // });

  // useHotkeys('ctrl+tab', e => {
  //   e.preventDefault();
  //   nextTab();
  // });

  // useHotkeys('ctrl+shift+tab', e => {
  //   e.preventDefault();
  //   previousTab();
  // });

  if (!mounted) {
    return null;
  }

  return (
    <SidebarProvider ref={formRef as any}>
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
