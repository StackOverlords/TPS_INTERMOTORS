import { ClipboardList, Landmark, List, Tags, TrendingUp } from "lucide-react";
import type RouteType from "./RouteType";
import { lazyScreen } from "./lazyScreen";

const CashSessionDetailScreen = lazyScreen(() => import("@/modules/caja/screens/CashSessionDetailScreen"));
const CashSessionListScreen = lazyScreen(() => import("@/modules/caja/screens/CashSessionListScreen"));
const ExpenseTypesScreen = lazyScreen(() => import("@/modules/caja/screens/ExpenseTypesScreen"));
const CashFlowReportScreen = lazyScreen(() => import("@/modules/caja/screens/CashFlowReportScreen"));

const cashProtectedRoutes: RouteType[] = [
  {
    name: "Caja",
    type: "protected",
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
    icon: Landmark,
    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/caja/sesiones",
        name: "Sesiones",
        type: "protected",
        element: CashSessionListScreen,
        isAdmin: false,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: List,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/caja/sesiones/:id",
        name: "Detalle de Sesión",
        type: "protected",
        element: CashSessionDetailScreen,
        isAdmin: false,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: ClipboardList,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,
      },
      {
        path: "/dashboard/caja/tipos-gasto",
        name: "Tipos de Gasto",
        type: "protected",
        element: ExpenseTypesScreen,
        isAdmin: false,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Tags,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/caja/reportes/flujo",
        name: "Flujo de Caja",
        type: "protected",
        element: CashFlowReportScreen,
        isAdmin: false,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: TrendingUp,
        isHeader: false,
        showSidebar: true,
      },
    ],
  },
];

export default cashProtectedRoutes;
