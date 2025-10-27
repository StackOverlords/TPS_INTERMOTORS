import type { ViewConfiguration } from "@/config/viewConfigTypes";
import type React from "react";

export default interface RouteType {
    path?: string;
    element?: React.ComponentType<any>;
    name: string;
    type: "public" | "protected";
    icon?: any;
    exact?: boolean;
    isAdmin?: boolean;
    role?: ["admin" | "user" | "guest"]; // Define roles if needed

    subRoutes?: RouteType[];
    isHeader?: boolean;
    showSidebar?: boolean
    showInCommandPalette?: boolean;

    viewConfig?: ViewConfiguration;
}