import { ClipboardList, Landmark, List, Tags, TrendingUp } from "lucide-react";
import CashSessionDetailScreen from "@/modules/caja/screens/CashSessionDetailScreen";
import CashSessionListScreen from "@/modules/caja/screens/CashSessionListScreen";
import ExpenseTypesScreen from "@/modules/caja/screens/ExpenseTypesScreen";
import CashFlowReportScreen from "@/modules/caja/screens/CashFlowReportScreen";
import type RouteType from "./RouteType";

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
