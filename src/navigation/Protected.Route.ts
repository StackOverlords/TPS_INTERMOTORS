import Content from "@/modules/dashboard/screens/content";
import { LayoutDashboardIcon } from "lucide-react";
import accountsPayable from "./AccountPayable.Route";
import ordersProtectedRoutes from "./Order.Route";
import productosProtectedRoutes from "./Productos.Route";
import purchasesProtectedRoutes from "./Purchases.Route";
import quotationsProtectedRoutes from "./Quotations.Route";
import returnsProtectedRoutes from "./Returns.Route";
import type RouteType from "./RouteType";
import salesProtectedRoutes from "./Sales.Route";
import settingsProtectedRoutes from "./Settings.Route";
import transfersProtectedRoutes from "./Transfers.Route";
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
  ...ordersProtectedRoutes,
  ...returnsProtectedRoutes,
  ...settingsProtectedRoutes,
  ...transfersProtectedRoutes,
  ...accountsPayable
];

export default protectedRoutes;