import { Badge } from "@/components/atoms/badge";
import { cn } from "@/lib/utils";
import React, { memo } from "react";
import { Link } from "react-router";

/**
 * Ítem del menú lateral. No lee la ubicación: el sidebar la lee una sola vez y
 * le pasa `isActive`, así que al navegar solo se re-renderizan los ítems que
 * cambian de estado (antes cada ítem usaba useLocation y el menú entero se
 * re-renderizaba en cada navegación o cambio de pestaña).
 */
const NavItem = ({
  href,
  icon: Icon,
  children,
  handleNavigation,
  badge,
  isActive,
}: {
  href: string;
  icon: any;
  children: React.ReactNode;
  handleNavigation: () => void;
  badge?: number | null;
  isActive: boolean;
}) => {
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

export default memo(NavItem);
