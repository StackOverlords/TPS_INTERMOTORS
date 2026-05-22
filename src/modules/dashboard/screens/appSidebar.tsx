import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/atoms/sidebar";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import { useUserRole } from "@/hooks/useUserRole";
// import useTreasuryDashboard from "@/modules/treasury/hooks/useTreasuryDashboard"; // WIP: backend not ready
import protectedRoutes from "@/navigation/Protected.Route";
import type RouteType from "@/navigation/RouteType";
import authSDK from "@/services/sdk-simple-auth";
import { useTabStore } from "@/states/tabStore";
import { useThemeStore } from "@/stores/themeStore";
import { filterRoutesByRole } from "@/utils/permissions";
import { LogOut, Settings, SquarePlus, CopyMinus } from "lucide-react";
import { useMemo, useState } from "react";
import ButtonItem from "../components/ButtonItem";
import HeaderTagRoute from "../components/HeaderTagRoute";
import NavItem from "../components/NavItem";
import logoLight from "@/assets/images/logo_light.webp";
import logoDark from "@/assets/images/darkmodeweb.webp";
import { Button } from "@/components/atoms/button";
import { queryClient } from "@/lib/reactQueryConfig";

const AppSidebar = () => {
  const [expandedHeaders, setExpandedHeaders] = useState<string[]>([]);
  const { setOpenMobile, isMobile } = useSidebar();
  const { available } = useUpdateChecker();
  const { rol: userRole } = useUserRole();
  // WIP: treasury/alerts deshabilitado hasta que el backend esté listo
  const badgeMap: Record<string, number> = {};
  const closeAllTabs = useTabStore((state) => state.closeAllTabs);
  const { resolvedTheme } = useThemeStore();

  // Filtrar rutas basándose en el rol del usuario
  const filteredRoutes = useMemo(() => {
    return filterRoutesByRole(protectedRoutes, userRole);
  }, [userRole]);

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Limpiar todas las tabs antes del logout
      closeAllTabs();
      queryClient.clear();
      // localStorage.removeItem("lastPath"); ///POR SI QUEREMOS BORRAR HISTORIAL DE ULTIMA RUTA
      await authSDK.logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const toggleHeader = (headerName: string) => {
    setExpandedHeaders((prev) =>
      prev.includes(headerName)
        ? prev.filter((name) => name !== headerName)
        : [...prev, headerName]
    );
  };

  const toggleExpandCollapse = () => {
    if (expandedHeaders.length > 0) {
      // Si hay headers expandidos, colapsar todo
      setExpandedHeaders([]);
    } else {
      // Si no hay headers expandidos, expandir todo
      const allHeaders = filteredRoutes
        .filter(
          (route) =>
            route.isHeader && route.subRoutes && route.subRoutes.length > 0
        )
        .map((route) => route.name);
      setExpandedHeaders(allHeaders);
    }
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border bg-background h-full"
    >
      <SidebarHeader className="h-16 flex justify-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <img
              src={resolvedTheme === "dark" ? logoDark : logoLight}
              alt="Intermotors Logo"
              className="h-10 w-auto object-contain transition-opacity duration-300"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-1 mt-2 mb-2">
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0">
              Principal
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-accent"
              onClick={toggleExpandCollapse}
              title={
                expandedHeaders.length > 0 ? "Colapsar todo" : "Expandir todo"
              }
            >
              {expandedHeaders.length > 0 ? (
                <CopyMinus className="h-3.5 w-3.5 transform scale-x-[-1]" />
              ) : (
                <SquarePlus className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <SidebarGroupContent className="px-1">
            <SidebarMenu>
              {filteredRoutes.map((route: RouteType, index) => (
                <HeaderTagRoute
                  handleNavigation={handleNavigation}
                  toggleHeader={toggleHeader}
                  expandedHeaders={expandedHeaders}
                  key={`${route.name}-${index}`}
                  route={route}
                  badgeMap={badgeMap}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-0">
        <SidebarGroup>
          <SidebarGroupLabel className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-1">
            <SidebarMenu className="gap-2">
              <NavItem
                href="/dashboard/settings"
                handleNavigation={handleNavigation}
                icon={Settings}
                badge={available ? 1 : null}
              >
                Configuración
              </NavItem>
              {/* <NavItem
                href="#"
                handleNavigation={handleNavigation}
                icon={HelpCircle}
              >
                Ayuda
              </NavItem> */}
              <ButtonItem
                className="bg-primary text-primary-foreground hover:text-primary-foreground hover:bg-primary/90"
                icon={LogOut}
                onClick={handleLogout}
              >
                Cerrar Sesión
              </ButtonItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};
export default AppSidebar;
