// import CxPProjectionScreen from "@/modules/cxp/screens/CxPProjectionScreen"; // backend sin datos aún
// import AlertsScreen from "@/modules/alerts/screens/AlertsScreen"; // backend WIP
// import TreasuryDashboardScreen from "@/modules/treasury/screens/TreasuryDashboardScreen"; // backend WIP
import {
  Landmark,
  TableCellsMerge,
  FileText,
  Users,
  Trophy,
} from "lucide-react";
import type RouteType from "./RouteType";
import { lazyScreen } from "./lazyScreen";

const CxPListScreen = lazyScreen(() => import("@/modules/cxp/screens/CxPListScreen"));
const CxPGeneralReportScreen = lazyScreen(() => import("@/modules/cxp/screens/CxPGeneralReportScreen"));
const CxPBySupplierReportScreen = lazyScreen(() => import("@/modules/cxp/screens/CxPBySupplierReportScreen"));
const CxPRankingReportScreen = lazyScreen(() => import("@/modules/cxp/screens/CxPRankingReportScreen"));

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
      // {
      //   path: "/dashboard/cxp/projection",
      //   name: "Proyección de Pagos",
      //   element: CxPProjectionScreen,  // backend sin datos — comentado temporalmente
      // },
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
      // Alerts: backend WIP
      // Treasury: backend WIP
    ],
  },
];

export default financeRoutes;
