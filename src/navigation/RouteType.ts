import type { ViewConfiguration } from "@/config/viewConfigTypes";
import type { UserRole } from "@/hooks/useUserRole";
import type React from "react";

export default interface RouteType {
    path?: string;
    element?: React.ComponentType<any>;
    name: string;
    type: "public" | "protected";
    icon?: any;
    exact?: boolean;
    isAdmin?: boolean;
    role?: UserRole[]; // Roles permitidos: Administrador, Vendedor, guest

    subRoutes?: RouteType[];
    isHeader?: boolean;
    showSidebar?: boolean
    showInCommandPalette?: boolean;

    viewConfig?: ViewConfiguration;
}