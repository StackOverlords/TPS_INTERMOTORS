import type RouteType from "@/navigation/RouteType";
import NavItem from "./NavItem";
import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/atoms/sidebar";

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
  const hasSubRoutes = route.subRoutes && route.subRoutes.length > 0;

  const isInSubRoute = hasSubRoutes
    ? (route.subRoutes ?? []).some(
      (subRoute) => subRoute.path && location.pathname.startsWith(subRoute.path)
    )
    : false;

  const isExpanded = expandedHeaders.includes(route.name) || isInSubRoute;

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
          isInSubRoute
            ? "bg-primary text-white"
            : "text-gray-700 hover:bg-secondary hover:text-secondary-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          {route.icon && <route.icon className="h-4 w-4 flex-shrink-0" />}
          <span className="text-xs font-semibold uppercase tracking-wider">
            {route.name}
          </span>
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
          "ml-3 mt-1 border-l border-gray-400 pl-2 mr-0 pr-0 py-0",
        )}>
          {route.subRoutes
            ?.filter((subRoute) => subRoute.showSidebar && subRoute.path)
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