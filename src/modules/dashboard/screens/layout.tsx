import { SidebarInset, SidebarProvider } from '@/components/atoms/sidebar';
import TabBar from '@/components/tabs/TabBar';
import TabContainer from '@/components/tabs/TabContainer';
import { useTabBarKeybindings } from '@/hooks/keyBindings/useTabBarKeyBindings';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import CartSidebar from '@/modules/shoppingCart/components/CartSidebar';
import { useCartUiStore } from '@/modules/shoppingCart/store/cartUiStore';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import AppSidebar from './appSidebar';
import TopNav from './top-nav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isOpen, close, toggle, open } = useCartUiStore();
  const [mounted, setMounted] = useState(false);
  const { nextTab, previousTab, closeCurrentTab } = useTabNavigation();

  const { formRef } = useTabBarKeybindings({
    previousTab: previousTab,
    nextTab: nextTab,
    closeCurrentTab: closeCurrentTab,
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

  // Atajos de teclado para tabs
  useHotkeys('ctrl+t', e => {
    e.preventDefault();
    // El dashboard se abrirá automáticamente por el hook
    window.location.hash = '#/dashboard';
  });

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
      <SidebarInset className="min-w-0">
        <header className="border-b border-gray-200 sticky top-0 z-10 bg-white">
          <div className="h-16">
            <TopNav onOpenCartChange={toggle} />
          </div>
          <TabBar />
        </header>
        <div
          id="main-scroll-container"
          className="flex-1 overflow-hidden bg-gray-50"
        >
          <div className="h-full p-2">
            <TabContainer />
          </div>
        </div>
      </SidebarInset>
      <CartSidebar open={isOpen} onOpenChange={close} />
    </SidebarProvider>
  );
}
