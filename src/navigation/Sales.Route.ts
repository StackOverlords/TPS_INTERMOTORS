import {
  BarChart3,
  DollarSign,
  Receipt,
  ShoppingBag,
  Table2,
  TrendingUp,
} from "lucide-react";
import type RouteType from "./RouteType";
import { salesListViewConfig } from "@/modules/sales/config/sale.config";
import { lazyScreen } from "./lazyScreen";

const CreateSaleScreen = lazyScreen(() => import("@/modules/sales/screens/createSaleScreen"));
const SaleDetailScreen = lazyScreen(() => import("@/modules/sales/screens/saleDetailScreen"));
const SaleEditScreen = lazyScreen(() => import("@/modules/sales/screens/saleEditScreen"));
const SalesListScreen = lazyScreen(() => import("@/modules/sales/screens/salesListScreen"));
const MostSoldScreen = lazyScreen(() => import("@/modules/reports/screens/sales/mostSoldScreen"));
const TopRevenueScreen = lazyScreen(() => import("@/modules/reports/screens/sales/TopRevenueScreen"));
const GeneralReportScreen = lazyScreen(() => import("@/modules/reports/screens/sales/GeneralSaleReportScreen"));

const salesProtectedRoutes: RouteType[] = [
  {
    name: "Ventas",
    type: "protected",
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
    icon: Receipt,
    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/create-sale",
        name: "Registrar venta",
        type: "protected",
        element: CreateSaleScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: ShoppingBag,
        keepAlive: true,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/sales",
        name: "Lista de ventas",
        type: "protected",
        element: SalesListScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Table2,
        viewConfig: salesListViewConfig,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/reports/general",
        name: "Reporte general de ventas",
        type: "protected",
        element: GeneralReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: BarChart3,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/reports/most-sold",
        name: "Reporte más vendidos",
        type: "protected",
        element: MostSoldScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: TrendingUp,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/reports/top-revenue",
        name: "Reporte mayor ingreso",
        type: "protected",
        element: TopRevenueScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: DollarSign,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/sales/:saleCod",
        name: "Detalle de venta",
        type: "protected",
        element: SaleDetailScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,
      },
      {
        path: "/dashboard/sales/:saleId/update",
        name: "Editar venta",
        type: "protected",
        element: SaleEditScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        keepAlive: true,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,
      },
    ],
  },
];

export default salesProtectedRoutes;
