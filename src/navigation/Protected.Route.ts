import { LayoutDashboardIcon } from "lucide-react";
import accountsReceivable from "./AccountReceivable.Route";
import cashProtectedRoutes from "./Cash.Route";
// import financeRoutes from "./Finance.Route"; // WIP: cxp/alerts/treasury backend not ready
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
import Dashboard from "@/modules/dashboard/screens/dashboard";

const protectedRoutes: RouteType[] = [
  {
    path: "/dashboard",
    name: "Dashboard",
    type: "protected",
    element: Dashboard,
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
    icon: LayoutDashboardIcon,
    showSidebar: true,
  },
  ...cashProtectedRoutes,
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
  ...accountsReceivable,
  // ...financeRoutes, // WIP: cxp/alerts/treasury backend not ready
];

export default protectedRoutes;