import Content from "@/modules/dashboard/screens/content";
import { LayoutDashboardIcon } from "lucide-react";
import productosProtectedRoutes from "./Productos.Route";
import purchasesProtectedRoutes from "./Purchases.Route";
import quotationsProtectedRoutes from "./Quotations.Route";
import type RouteType from "./RouteType";
import salesProtectedRoutes from "./Sales.Route";
import settingsProtectedRoutes from "./Settings.Route";
import usersProtectedRoutes from "./Users.Route";

const protectedRoutes: RouteType[] = [
  {
    path: "/dashboard",
    name: "Dashboard",
    type: "protected",
    element: Content,
    isAdmin: false,
    role: ["user"],
    icon: LayoutDashboardIcon,
    showSidebar: true,
  },
  ...usersProtectedRoutes,
  ...productosProtectedRoutes,
  // ...categoryProtectedRoutes,
  ...purchasesProtectedRoutes,
  ...salesProtectedRoutes,
  ...quotationsProtectedRoutes,
  ...settingsProtectedRoutes
];

export default protectedRoutes;