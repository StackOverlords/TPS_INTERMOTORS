import type RouteType from "@/navigation/RouteType";
import NavItem from "./NavItem";
import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/atoms/sidebar";
import { useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { hasRouteAccess } from "@/utils/permissions";

const HeaderTagRoute = ({
  route,
  expandedHeaders,
  toggleHeader,
  handleNavigation
}: {
  route: RouteType;
  expandedHeaders: string[]
  toggleHeader: (headerName: string) => void
  handleNavigation: () => void
}) => {
  const location = useLocation();
  const { rol: userRole } = useUserRole();
  const hasSubRoutes = route.subRoutes && route.subRoutes.length > 0;

  const isInSubRoute = hasSubRoutes
    ? (route.subRoutes ?? []).some(
      (subRoute) => subRoute.path && location.pathname.startsWith(subRoute.path)
    )
    : false;

  const isExpanded = expandedHeaders.includes(route.name);

  // Auto-expandir cuando navegas a una subruta, pero permitir colapsarlo manualmente
  useEffect(() => {
    if (isInSubRoute && !isExpanded) {
      toggleHeader(route.name);
    }
  }, [isInSubRoute]);

  if (!route.showSidebar) return null

  if (!route.isHeader) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavItem
            key={route.path}
            href={route.path || "/"}
            icon={route.icon}
            handleNavigation={handleNavigation}
          >
            {route.name}
          </NavItem>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => toggleHeader(route.name)}
        className={cn(
          "flex items-center justify-between gap-2 p-2 text-sm font-medium cursor-pointer rounded-md transition-colors",
          "bg-primary/90 text-primary-foreground hover:bg-primary/80"
        )}
      >
        <div className="flex items-center gap-2">
          {route.icon && <route.icon className="h-4 w-4 flex-shrink-0" />}
          <span className="text-xs font-semibold uppercase tracking-wider">
            {route.name}
          </span>
          {isInSubRoute && !isExpanded && (
            <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" title="Ruta activa" />
          )}
        </div>
        {hasSubRoutes && (
          <div className="ml-2">
            <ChevronRight className={cn(
              "size-4 transition-transform duration-200",
              isExpanded && "rotate-90"
            )} />
          </div>
        )}
      </SidebarMenuButton>

      {hasSubRoutes && isExpanded && (
        <SidebarMenuSub className={cn(
          "ml-3 mt-1 border-l border-border pl-2 mr-0 pr-0 py-0",
        )}>
          {route.subRoutes
            ?.filter((subRoute) =>
              subRoute.showSidebar &&
              subRoute.path &&
              hasRouteAccess(subRoute, userRole)
            )
            .map((subRoute, index) => (
              <SidebarMenuSubItem
                key={`${subRoute.path}-${index}`}
              >
                <SidebarMenuSubButton asChild>
                  <NavItem
                    href={subRoute.path || "#"}
                    icon={subRoute.icon}
                    handleNavigation={handleNavigation}
                  >
                    {subRoute.name}
                  </NavItem>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
};
export default HeaderTagRoute;