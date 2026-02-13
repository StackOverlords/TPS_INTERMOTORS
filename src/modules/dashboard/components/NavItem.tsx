import { Badge } from "@/components/atoms/badge";
import { cn } from "@/lib/utils";
import React from "react";
import { Link, matchPath, useLocation } from "react-router";

const NavItem = ({
  href,
  icon: Icon,
  children,
  handleNavigation,
  badge,
}: {
  href: string;
  icon: any;
  children: React.ReactNode;
  handleNavigation: () => void;
  badge?: number | null;
}) => {
  const { pathname } = useLocation();

  // Para /dashboard usamos coincidencia exacta
  // Para otras rutas también usamos exacta para evitar conflictos
  const match = matchPath({ path: href, end: true }, pathname);
  const isActive = Boolean(match);

  return (
    <Link
      to={href}
      onClick={handleNavigation}
      className={cn(
        "flex items-center p-2 gap-2 text-sm rounded-md transition-all relative overflow-hidden",
        isActive
          ? " bg-secondary text-primary font-bold before:absolute before:left-0 before:top-1/2 before:h-full before:w-1.5 before:-translate-y-1/2 before:rounded-r before:bg-primary"
          : "text-foreground hover:bg-secondary hover:text-secondary-foreground"
      )}
    >
      {Icon && <Icon className="size-4 flex-shrink-0" />}
      <span className="flex-1">{children}</span>
      {badge !== null && badge !== undefined && badge > 0 && (
        <Badge
          variant="destructive"
          className="h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {badge}
        </Badge>
      )}
    </Link>
  );
};

export default NavItem;
