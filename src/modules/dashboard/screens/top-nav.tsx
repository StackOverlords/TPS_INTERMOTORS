import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { SidebarTrigger } from "@/components/atoms/sidebar";
import ShortcutKey from "@/components/common/ShortcutKey";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import protectedRoutes from "@/navigation/Protected.Route";
import type RouteType from "@/navigation/RouteType";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { Bell, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Link, matchPath, useLocation } from "react-router";
import SelectBranch from "../components/SelectBranch";
import CommandPalette from "./CommandPalette/CommandPalette";
import SearchButton from "./CommandPalette/SearchButton";

interface TopNavProps {
  onOpenCartChange: () => void
}

const flattenRoutes = (routes: RouteType[]): RouteType[] => {
  const flattened: RouteType[] = [];

  routes.forEach((route) => {
    if (route.path) {
      flattened.push(route);
    }

    if (route.subRoutes) {
      flattened.push(...flattenRoutes(route.subRoutes));
    }
  });

  return flattened;
};
const matchRoute = (routes: RouteType[], pathname: string): RouteType | null => {
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

const findParentRoute = (routes: RouteType[], pathname: string): RouteType | null => {
  for (const route of routes) {
    if (route.subRoutes?.some(sr => sr.path && matchPath({ path: sr.path, end: true }, pathname))) {
      return route;
    }
    const nestedParent = route.subRoutes ? findParentRoute(route.subRoutes, pathname) : null;
    if (nestedParent) return route;
  }
  return null;
};


const TopNav: React.FC<TopNavProps> = ({
  onOpenCartChange
}) => {
  const user = authSDK.getCurrentUser()
  const { selectedBranchId } = useBranchStore()
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // const routes = protectedRoutes.filter((route) => route.type === "protected");
  const routes = protectedRoutes.filter((route) => route.type === "protected");
  // const flatRoutes = flattenRoutes(routes);

  // const currentRoute = flatRoutes.find((route) => route.path === location.pathname);
  const currentRoute = matchRoute(routes, location.pathname);

  // const parentRoute = findParentRoute(routes, location.pathname);
  const parentRoute = findParentRoute(routes, location.pathname);
  const {
    getCartCount: cartLength
  } = useCartWithUtils(user?.name || '', selectedBranchId ?? '')
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      setOpen(!open);
    },
    {
      enableOnFormTags: true,
      enabled: true,
    }
  );

  useHotkeys("esc", () => setOpen(false), {
    enableOnFormTags: true,
    enabled: open,
  });

  const renderBreadcrumb = () => {
    if (location.pathname === "/dashboard") {
      return (
        <Link className="hidden sm:flex" to={"/dashboard"}>
          Dashboard/
        </Link>
      );
    }

    const breadcrumbItems = [];

    breadcrumbItems.push(
      <Link
        key="dashboard"
        to={"/dashboard"}
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
        {currentRoute?.name || "Ruta Desconocida"}
      </Link>
    );

    return <div className="hidden sm:flex">{breadcrumbItems}</div>;
  };

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
        <TooltipWrapper
          tooltip={
            <p>Presiona <ShortcutKey combo="alt+c" /> para abrir el carrito</p>
          }
        >
          <Button variant="outline" className="relative size-8 cursor-pointer" size={'sm'} onClick={onOpenCartChange}>
            <ShoppingCart className="h-4 w-4" />
            {cartLength() > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {cartLength()}
              </Badge>
            )}
          </Button>
        </TooltipWrapper>
        <Button
          variant={'outline'}
          type="button"
          className="flex items-center justify-center hover:bg-gray-100 transition-colors size-8"
        >
          <Bell className="w-4 h-4 text-gray-600 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </nav>
  );
};

export default TopNav;