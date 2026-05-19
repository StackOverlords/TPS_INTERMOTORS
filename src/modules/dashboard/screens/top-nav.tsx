import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { SidebarTrigger } from "@/components/atoms/sidebar";
import NotificationsPanel from "@/components/common/NotificationsPanel";
import ShortcutKey from "@/components/common/ShortcutKey";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { useTaskNotificationsContext } from "@/contexts/TaskNotificationsContext";
import { COMMANDS, useCommand, useKeybindingKeys } from "@/keybindings";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
// import { useChatUiStore } from "@/modules/chat/store/chatUiStore";
import protectedRoutes from "@/navigation/Protected.Route";
import type RouteType from "@/navigation/RouteType";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  ShoppingCart,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, matchPath, useLocation } from "react-router";
import SelectBranch from "../components/SelectBranch";
import { ZoomControls } from "../components/ZoomControls";
import CommandPalette from "./CommandPalette/CommandPalette";
import SearchButton from "./CommandPalette/SearchButton";
import ProfilePanel from "@/components/common/ProfilePanel";
import ThemeToggle from "@/components/common/ThemeToggle";
import DownloadsPanel from "@/components/common/DownloadsPanel";
import { getUserAvatarGradient } from "@/utils/userColors";
import { ChatTopbarButton } from "@/modules/messaging/components/ChatTopBarButton";

interface TopNavProps {
  onOpenCartChange: () => void;
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
        (sr) => sr.path && matchPath({ path: sr.path, end: true }, pathname)
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const avatarGradient = getUserAvatarGradient(user?.id, user?.name);

  // Profile
  const [openProfile, setOpenProfile] = useState(false);

  const routes = protectedRoutes.filter((route) => route.type === "protected");
  const currentRoute = matchRoute(routes, location.pathname);
  const parentRoute = findParentRoute(routes, location.pathname);
  const cart = useCartWithUtils(user?.name || "", selectedBranchId ?? "");
  // const { toggle: toggleChat, isOpen: chatOpen } = useChatUiStore();

  // Context de notificaciones
  const { tasks, removeTask, clearTasks } = useTaskNotificationsContext();
  const inProgressCount = tasks.filter(
    (t) => t.status === "in-progress" || t.status === "pending"
  ).length;

  // Obtener teclas actuales del store (reactivas)
  const commandPaletteKeys = useKeybindingKeys("actions.commandPalette");
  const changeBranchKeys = useKeybindingKeys("actions.changeBranch");
  const openCartKeys = useKeybindingKeys("actions.openCart");
  const openNotificationsKeys = useKeybindingKeys("actions.openNotifications");

  // Handlers
  const handleToggleCommandPalette = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);
  const handleCloseCommandPalette = useCallback(() => {
    setOpen(false);
  }, []);
  const handleChangeBranch = useCallback(() => {
    const toggleEvent = new CustomEvent("toggleBranchSelector");
    document.dispatchEvent(toggleEvent);
  }, []);
  const handleOpenNotifications = useCallback(() => {
    setNotificationsOpen((prev) => !prev);
  }, []);

  // Registrar comandos
  useCommand("actions.commandPalette", handleToggleCommandPalette, {
    enableOnFormTags: true,
  });
  useCommand("actions.closeModal", handleCloseCommandPalette, {
    enableOnFormTags: true,
    enabled: open,
  });
  useCommand("actions.openCart", onOpenCartChange, {
    enableOnFormTags: true,
  });
  useCommand("actions.openNotifications", handleOpenNotifications, {
    enableOnFormTags: true,
  });
  useCommand("actions.changeBranch", handleChangeBranch, {
    enableOnFormTags: true,
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
        className="text-muted-foreground hover:text-foreground"
      >
        Dashboard/
      </Link>
    );

    if (parentRoute) {
      breadcrumbItems.push(
        <span key="parent" className="text-muted-foreground">
          {parentRoute.name}/
        </span>
      );
    }
    breadcrumbItems.push(
      <Link
        key="current"
        to={location.pathname}
        className="text-foreground hover:text-foreground/80"
      >
        {currentRoute?.name || "Ruta Desconocida"}
      </Link>
    );

    return <div className="hidden sm:flex">{breadcrumbItems}</div>;
  };
  return (
    <nav className="flex items-center justify-between h-full px-2 bg-background border-b border-border sm:px-4">
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
        <div className="flex items-center gap-4 w-full">
          <ChatTopbarButton />
        </div>
        {cart.sourceQuotation && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative size-8">
                <FileText className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">Cotización pendiente</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                La cotización <span className="font-medium text-foreground">#{cart.sourceQuotation.nro}</span> está siendo convertida a venta. Cancelá si querés empezar desde cero.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => cart.clearCart()}
              >
                Cancelar conversión
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant="outline"
          className="relative size-8 cursor-pointer"
          size={"sm"}
          onClick={onOpenCartChange}
        >
          <ShoppingCart className="h-4 w-4" />
          {cart.items.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {cart.items.length}
            </Badge>
          )}
        </Button>
        <DownloadsPanel />
        <NotificationsPanel
          tasks={tasks}
          onDismiss={removeTask}
          onClearAll={clearTasks}
          isOpen={notificationsOpen}
          onOpenChange={setNotificationsOpen}
          trigger={
            <Button
              variant={"outline"}
              type="button"
              className="relative flex items-center justify-center hover:bg-accent transition-colors size-8"
            >
              <Bell className="w-4 h-4" />
              {inProgressCount > 0 && (
                <Badge
                  variant="info"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                >
                  {inProgressCount}
                </Badge>
              )}
            </Button>
          }
        />
        <ZoomControls />

        <TooltipWrapper
          tooltipContentProps={{
            align: "end",
            className: "max-w-xs",
          }}
          tooltip={
            <div className="flex flex-col space-y-3">
              <div className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Atajos de teclado
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-foreground tracking-wide">
                  Navegación
                </h4>
                <div className="space-y-1 text-muted-foreground text-xs">
                  <p>
                    {" "}
                    <ShortcutKey combo={commandPaletteKeys} />
                    {COMMANDS["actions.commandPalette"].description}
                  </p>
                  <p>
                    {" "}
                    <ShortcutKey combo={changeBranchKeys} />{" "}
                    {COMMANDS["actions.changeBranch"].description}{" "}
                  </p>
                  <p>
                    {" "}
                    <ShortcutKey combo={openCartKeys} />{" "}
                    {COMMANDS["actions.openCart"].description}
                  </p>
                  <p>
                    {" "}
                    <ShortcutKey combo={openNotificationsKeys} />{" "}
                    {COMMANDS["actions.openNotifications"].description}
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <span className="border-border border h-8 w-8 px-1 rounded-md flex flex-shrink-0 items-center justify-center cursor-help hover:bg-accent">
            <HelpCircle className="w-4 h-4" />
          </span>
        </TooltipWrapper>
        <ThemeToggle />
        <ProfilePanel
          isOpen={openProfile}
          onOpenChange={setOpenProfile}
          trigger={
            <div className="hidden sm:flex items-center space-x-2 border-l border-border pl-4 cursor-pointer">
              <div
                className={`h-8 w-8 ${avatarGradient.gradient} ${avatarGradient.darkGradient} rounded-full flex items-center justify-center flex-shrink-0`}
              >
                <span className={`${avatarGradient.text} font-semibold`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {user?.name || "Usuario"}
              </span>
              {openProfile ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          }
        />
      </div>
    </nav>
  );
};

export default TopNav;
