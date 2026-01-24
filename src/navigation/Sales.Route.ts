import CreateSaleScreen from "@/modules/sales/screens/createSaleScreen";
import SaleDetailScreen from "@/modules/sales/screens/saleDetailScreen";
import SaleEditScreen from "@/modules/sales/screens/saleEditScreen";
import SalesListScreen from "@/modules/sales/screens/salesListScreen";
import { Receipt, ShoppingBag, Table2 } from "lucide-react";
import type RouteType from "./RouteType";
import { salesListViewConfig } from "@/modules/sales/config/sale.config";
import MostSoldScreen from "@/modules/reports/screens/mostSoldScreen";
import TopRevenueScreen from "@/modules/reports/screens/TopRevenueScreen";

const salesProtectedRoutes: RouteType[] = [
  {
    name: "Ventas",
    type: "protected",
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
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
        role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
        icon: ShoppingBag,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/sales",
        name: "Lista de ventas",
        type: "protected",
        element: SalesListScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
        icon: Table2,
        viewConfig: salesListViewConfig,
        isHeader: false,
        showSidebar: true
      },
       {
        path: "/dashboard/saleRepor/mostsold",
        name: "Reporte Mayor Cantidad Vendida",
        type: "protected",
        element: MostSoldScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
        icon: Table2,
        viewConfig: salesListViewConfig,
        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/saleReport/mostrevenue",
        name: "Reporte Mayor Ingreso",
        type: "protected",
        element: TopRevenueScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
        icon: Table2,
        viewConfig: salesListViewConfig,
        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/sales/:saleCod",
        name: "Detalle de venta",
        type: "protected",
        element: SaleDetailScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
      {
        path: "/dashboard/sales/:saleId/update",
        name: "Editar venta",
        type: "protected",
        element: SaleEditScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
    ]
  },
];

export default salesProtectedRoutes;