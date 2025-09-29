import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { SidebarTrigger } from '@/components/atoms/sidebar';
import ShortcutKey from '@/components/common/ShortcutKey';
import { TooltipWrapper } from '@/components/common/TooltipWrapper';
import keyBindings from '@/hooks/keyBindings/global.keys';
import { useTopNavKeybindings } from '@/hooks/keyBindings/useTopNavKeybindings';
import { useCartWithUtils } from '@/modules/shoppingCart/hooks/useCartWithUtils';
import protectedRoutes from '@/navigation/Protected.Route';
import type RouteType from '@/navigation/RouteType';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { Bell, HelpCircle, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router';
import SelectBranch from '../components/SelectBranch';
import CommandPalette from './CommandPalette/CommandPalette';
import SearchButton from './CommandPalette/SearchButton';

interface TopNavProps {
  onOpenCartChange: () => void;
}

const flattenRoutes = (routes: RouteType[]): RouteType[] => {
  const flattened: RouteType[] = [];

  routes.forEach(route => {
    if (route.path) {
      flattened.push(route);
    }

    if (route.subRoutes) {
      flattened.push(...flattenRoutes(route.subRoutes));
    }
  });

  return flattened;
};
const matchRoute = (
  routes: RouteType[],
  pathname: string
): RouteType | null => {
  for (const route of routes) {
    if (route.path && matchPath({ path: route.path, end: true }, pathname)) {
      return route;
    }
    if (route.subRoutes) {
      const found = matchRoute(route.subRoutes, pathname);
      if (found) return found;
    }
  }
  return null;
};

const findParentRoute = (
  routes: RouteType[],
  pathname: string
): RouteType | null => {
  for (const route of routes) {
    if (
      route.subRoutes?.some(
        sr => sr.path && matchPath({ path: sr.path, end: true }, pathname)
      )
    ) {
      return route;
    }
    const nestedParent = route.subRoutes
      ? findParentRoute(route.subRoutes, pathname)
      : null;
    if (nestedParent) return route;
  }
  return null;
};

const TopNav: React.FC<TopNavProps> = ({ onOpenCartChange }) => {
  const user = authSDK.getCurrentUser();
  const { selectedBranchId } = useBranchStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const routes = protectedRoutes.filter(route => route.type === 'protected');
  const currentRoute = matchRoute(routes, location.pathname);
  const parentRoute = findParentRoute(routes, location.pathname);
  const { getCartCount: cartLength } = useCartWithUtils(
    user?.name || '',
    selectedBranchId ?? ''
  );

  useTopNavKeybindings({
    onOpenCommandPalette: () => setOpen(true),
    onCloseCommandPalette: () => setOpen(false),
    onOpenCart: onOpenCartChange,
    onOpenNotifications: () => {
      console.log('Abriendo notificaciones... adadawdadw');
      // Aquí lógica para mostrar notificaciones
    },
    onChangeBranch: () => {
      // Disparar evento personalizado para alternar el selector de sucursal
      const toggleEvent = new CustomEvent('toggleBranchSelector');
      document.dispatchEvent(toggleEvent);
    },
    commandPaletteOpen: open,
  });

  const renderBreadcrumb = () => {
    if (location.pathname === '/dashboard') {
      return (
        <Link className="hidden sm:flex" to={'/dashboard'}>
          Dashboard/
        </Link>
      );
    }

    const breadcrumbItems = [];

    breadcrumbItems.push(
      <Link
        key="dashboard"
        to={'/dashboard'}
        className="text-gray-500 hover:text-gray-700"
      >
        Dashboard/
      </Link>
    );

    if (parentRoute) {
      breadcrumbItems.push(
        <span key="parent" className="text-gray-500">
          {parentRoute.name}/
        </span>
      );
    }
    breadcrumbItems.push(
      <Link
        key="current"
        to={location.pathname}
        className="text-gray-800 hover:text-gray-900"
      >
        {currentRoute?.name || 'Ruta Desconocida'}
      </Link>
    );

    return <div className="hidden sm:flex">{breadcrumbItems}</div>;
  };
  console.log(user);
  return (
    <nav className="flex items-center justify-between h-full px-2 bg-white border-b border-gray-200 sm:px-4">
      <div className="font-medium text-sm flex items-center space-x-1 truncate w-full">
        <SidebarTrigger />
        {renderBreadcrumb()}
      </div>

      <div className="flex items-center gap-2 ml-auto sm:gap-3 sm:ml-0">
        <div className="flex items-center gap-4">
          <SearchButton onClick={() => setOpen(true)} />
          <CommandPalette open={open} setOpen={setOpen} />
        </div>

        <div className="flex items-center gap-4 w-full">
          <SelectBranch></SelectBranch>
        </div>
        <Button
          variant="outline"
          className="relative size-8 cursor-pointer"
          size={'sm'}
          onClick={onOpenCartChange}
        >
          <ShoppingCart className="h-4 w-4" />
          {cartLength() > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {cartLength()}
            </Badge>
          )}
        </Button>
        <Button
          variant={'outline'}
          type="button"
          className="flex items-center justify-center hover:bg-gray-100 transition-colors size-8"
          onClick={() => {
            console.log('Abriendo notificaciones...');
            // Lógica para notificaciones
          }}
        >
          <Bell className="w-4 h-4 text-gray-600 sm:h-5 sm:w-5" />
        </Button>
        <TooltipWrapper
          tooltipContentProps={{
            align: 'end',
            className: 'max-w-xs',
          }}
          tooltip={
            <div className="flex flex-col space-y-3">
              <div className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Atajos de teclado
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-gray-700 tracking-wide">
                  Navegación
                </h4>
                <div className="space-y-1 text-gray-600 text-xs">
                  <p>
                    {' '}
                    <ShortcutKey
                      combo={keyBindings.actions.openCommandPalette.keys}
                    />
                    {keyBindings.actions.openCommandPalette.description}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey
                      combo={keyBindings.actions.changeBranch.keys}
                    />{' '}
                    {keyBindings.actions.changeBranch.description}{' '}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey
                      combo={keyBindings.actions.openCart.keys}
                    />{' '}
                    {keyBindings.actions.openCart.description}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey
                      combo={keyBindings.actions.openNotifications.keys}
                    />{' '}
                    {keyBindings.actions.openNotifications.description}
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <span className="border-gray-200 border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
            <HelpCircle className="w-4 h-4" />
          </span>
        </TooltipWrapper>
        <div
          className="hidden sm:flex items-center space-x-2 border-l border-gray-200 pl-4 cursor-pointer"
          onClick={() => {
            // Aquí podrías abrir un modal con la información del usuario o un menú desplegable
            console.log('Clic en el nombre de usuario');
          }}
        >
          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {user?.name || 'Usuario'}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
