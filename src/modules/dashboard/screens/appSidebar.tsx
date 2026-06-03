import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
import { usePluginSidebarSections, usePluginSettingsActions } from "@/plugins";
import type { SidebarSection, SettingsAction, IconProps } from "@tps/plugin-sdk";
import type { ComponentType } from "react";

const AppSidebar = () => {
  const [expandedHeaders, setExpandedHeaders] = useState<string[]>([]);
  const { setOpenMobile, isMobile } = useSidebar();
  const { available } = useUpdateChecker();
  const { rol: userRole } = useUserRole();
  // WIP: treasury/alerts deshabilitado hasta que el backend esté listo
  const badgeMap: Record<string, number> = {};
  const closeAllTabs = useTabStore((state) => state.closeAllTabs);
  const { resolvedTheme } = useThemeStore();

  // Hooks reactivos del sistema de plugins (Fase 3)
  const pluginSidebarSections = usePluginSidebarSections();
  const pluginSettingsActions = usePluginSettingsActions();

  // Filtrar rutas basándose en el rol del usuario
  const filteredRoutes = useMemo(() => {
    return filterRoutesByRole(protectedRoutes, userRole);
  }, [userRole]);

  /**
   * Filtra las secciones de plugins según el rol del usuario.
   * SidebarSection.items es RouteConfig[], que tiene un campo `roles?: string[]`.
   * Si roles está vacío o no definido → acceso público (misma lógica que hasRouteAccess).
   */
  const filteredPluginSections = useMemo<SidebarSection[]>(() => {
    return pluginSidebarSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.roles || item.roles.length === 0) return true;
          return item.roles.includes(userRole);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [pluginSidebarSections, userRole]);

  /**
   * Filtra las acciones de settings de plugins.
   * SettingsAction no tiene campo `roles` en el SDK — se exponen todas.
   * Si en el futuro el SDK agrega `roles`, filtrar aquí con la misma lógica.
   */
  const filteredPluginSettingsActions = useMemo<SettingsAction[]>(() => {
    return pluginSettingsActions;
  }, [pluginSettingsActions]);

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    try {
      closeAllTabs();
      queryClient.clear();
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

        {/* Secciones de plugins — renderizadas de forma aditiva después de las rutas estáticas.
            Cada SidebarSection del SDK se mapea a un SidebarGroup propio con su label e ítems.
            Mapeo de campos SDK → TPS:
              section.label  → SidebarGroupLabel (texto visible)
              section.icon   → ícono del grupo (opcional, ComponentType<IconProps>)
              section.items  → RouteConfig[] → NavItem por cada ítem
                item.path    → href del NavItem
                item.label   → children del NavItem
                item.icon    → icon prop del NavItem (ComponentType<IconProps>)
            El filtrado por rol ya fue aplicado en filteredPluginSections (roles de RouteConfig.roles). */}
        {filteredPluginSections.map((section: SidebarSection) => {
          const SectionIcon = section.icon as ComponentType<IconProps> | undefined;
          return (
            <SidebarGroup key={section.id}>
              <div className="flex items-center px-1 mt-2 mb-2">
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0 flex items-center gap-1.5">
                  {SectionIcon && <SectionIcon className="h-3.5 w-3.5" />}
                  {section.label}
                </SidebarGroupLabel>
              </div>
              <SidebarGroupContent className="px-1">
                <SidebarMenu>
                  {section.items.map((item) => {
                    const ItemIcon = item.icon as ComponentType<IconProps> | undefined;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild>
                          <NavItem
                            href={item.path}
                            icon={ItemIcon}
                            handleNavigation={handleNavigation}
                          >
                            {item.label}
                          </NavItem>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
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

              {/* Acciones de settings aportadas por plugins — insertas antes del logout.
                  Mapeo de campos SDK → TPS:
                    action.label      → children del ButtonItem / texto visible
                    action.icon       → icon prop del ButtonItem (ComponentType<IconProps>)
                    action.onClick    → onClick del ButtonItem
                    action.destructive → className destructivo (text-destructive)
                  SettingsAction no tiene campo `roles` en el SDK — se muestran todas
                  las que el hook filteredPluginSettingsActions ya devuelve. */}
              {filteredPluginSettingsActions.map((action: SettingsAction) => {
                const ActionIcon = action.icon as ComponentType<IconProps> | undefined;
                // ButtonItem requiere onClick no-opcional; proveemos no-op si el plugin no lo define.
                const handleAction = action.onClick ?? (() => {});
                return (
                  <ButtonItem
                    key={action.id}
                    className={
                      action.destructive
                        ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                        : undefined
                    }
                    icon={ActionIcon}
                    onClick={handleAction}
                  >
                    {action.label}
                  </ButtonItem>
                );
              })}

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
