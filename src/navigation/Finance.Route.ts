import CxPListScreen from "@/modules/cxp/screens/CxPListScreen";
import CxPProjectionScreen from "@/modules/cxp/screens/CxPProjectionScreen";
import CxPGeneralReportScreen from "@/modules/cxp/screens/CxPGeneralReportScreen";
import CxPBySupplierReportScreen from "@/modules/cxp/screens/CxPBySupplierReportScreen";
import CxPRankingReportScreen from "@/modules/cxp/screens/CxPRankingReportScreen";
import AlertsScreen from "@/modules/alerts/screens/AlertsScreen";
import TreasuryDashboardScreen from "@/modules/treasury/screens/TreasuryDashboardScreen";
import {
  Landmark,
  TableCellsMerge,
  TrendingDown,
  FileText,
  Users,
  Trophy,
  Bell,
  Vault,
} from "lucide-react";
import type RouteType from "./RouteType";

const financeRoutes: RouteType[] = [
  {
    name: "Finanzas",
    type: "protected",
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
    icon: Landmark,
    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/cxp/list",
        name: "Cuentas por Pagar",
        type: "protected",
        element: CxPListScreen,
        isAdmin: false,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: TableCellsMerge,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/cxp/projection",
        name: "Proyección de Pagos",
        type: "protected",
        element: CxPProjectionScreen,
        isAdmin: false,
        role: ["Administrador", "Super Admin"],
        icon: TrendingDown,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/cxp/reports/general",
        name: "Reporte General CxP",
        type: "protected",
        element: CxPGeneralReportScreen,
        isAdmin: false,
        role: ["Administrador", "Super Admin"],
        icon: FileText,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/cxp/reports/by-supplier",
        name: "Reporte por Proveedor",
        type: "protected",
        element: CxPBySupplierReportScreen,
        isAdmin: false,
        role: ["Administrador", "Super Admin"],
        icon: Users,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/cxp/reports/ranking",
        name: "Ranking de Proveedores",
        type: "protected",
        element: CxPRankingReportScreen,
        isAdmin: false,
        role: ["Administrador", "Super Admin"],
        icon: Trophy,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/alerts",
        name: "Alertas de Mora",
        type: "protected",
        element: AlertsScreen,
        isAdmin: false,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Bell,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/treasury",
        name: "Tesorería",
        type: "protected",
        element: TreasuryDashboardScreen,
        isAdmin: false,
        role: ["Administrador", "Super Admin"],
        icon: Vault,
        isHeader: false,
        showSidebar: true,
      },
    ],
  },
];

export default financeRoutes;
