import {
  BarChart,
  BarChart2,
  Clock,
  Package,
  ShoppingBag,
  ShoppingCart,
  Table2,
  Truck,
} from "lucide-react";
import type RouteType from "./RouteType";
import OrderListScreen from "@/modules/orders/screens/orderListScreen";
import OrderCreateScreen from "@/modules/orders/screens/orderCreateScreen";
import OrderEditScreen from "@/modules/orders/screens/orderEditScreen";
import OrderDetailScreen from "@/modules/orders/screens/orderDetailScreen";
import { ordersListViewConfig } from "@/modules/orders/config/order.config";
import OrderGeneralReportScreen from "@/modules/reports/screens/orders/orderGeneralReportScreen";
import OrderTopProveedoresReportScreen from "@/modules/reports/screens/orders/orderTopProvidersReportScreen";
import OrderTiempoMedioReportScreen from "@/modules/reports/screens/orders/orderTiempoMedioReportScreen";
import OrderCartListScreen from "@/modules/orderCart/screens/orderCartListScreen";

const ordersProtectedRoutes: RouteType[] = [
  {
    name: "Pedidos",
    type: "protected",
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
    icon: Truck,
    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/create-order",
        name: "Registrar pedido",
        type: "protected",
        element: OrderCreateScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: ShoppingBag,
        keepAlive: true,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/order-cart",
        name: "Lista de compras",
        type: "protected",
        element: OrderCartListScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: ShoppingCart,
        keepAlive: true,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/orders",
        name: "Lista de pedidos",
        type: "protected",
        element: OrderListScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Table2,
        viewConfig: ordersListViewConfig,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/orders/:orderCod",
        name: "Detalle de Pedido",
        type: "protected",
        element: OrderDetailScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Package,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,
      },
      {
        path: "/dashboard/orders/:orderId/update",
        name: "Editar Pedido",
        type: "protected",
        element: OrderEditScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        keepAlive: true,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,
      },
      {
        path: "/dashboard/order-general-report",
        name: "Reporte general de pedidos",
        type: "protected",
        element: OrderGeneralReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],

        icon: BarChart,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/order-top-providers-report",
        name: "Top proveedores",
        type: "protected",
        element: OrderTopProveedoresReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: BarChart2,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/order-tiempo-medio-report",
        name: "Tiempo medio de pedidos",
        type: "protected",
        element: OrderTiempoMedioReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: Clock,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
    ],
  },
];

export default ordersProtectedRoutes;
