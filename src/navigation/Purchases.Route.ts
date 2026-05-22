import CreatePurchase from "@/modules/purchases/screens/CreatePurchase";
import EditPurchase from "@/modules/purchases/screens/EditPurchase";
import PurchaseDetailScreen from "@/modules/purchases/screens/PurchaseDetailScreen";
import PurchaseListScreen from "@/modules/purchases/screens/PurchaseListScreen";
import UpdatePrices from "@/modules/purchases/screens/UpdatePrices";
import {
  DollarSign,
  Package,
  PencilLine,
  ScatterChart,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import type RouteType from "./RouteType";
import PurchaseGeneralReportScreen from "@/modules/reports/screens/purchases/purchaseGeneralReportScreen";
import PurchaseMasCompradoReportScreen from "@/modules/reports/screens/purchases/purchaseMasCompradoReportScreen";
import PurchaseMayorCostoReportScreen from "@/modules/reports/screens/purchases/purchaseMayorCostoReportScreen";

const purchasesProtectedRoutes: RouteType[] = [
  {
    name: "Compras",
    type: "protected",
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
    icon: ShoppingCart,
    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/create-purchase",
        name: "Registrar compra",
        type: "protected",
        element: CreatePurchase,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: ShoppingBag,
        keepAlive: true,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/list-purchases",
        name: "Lista de compras",
        type: "protected",
        element: PurchaseListScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Package,

        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/purchases/:purchaseId",
        name: "Detalle de compra",
        type: "protected",
        element: PurchaseDetailScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Package,

        showInCommandPalette: false,
        isHeader: false,
        showSidebar: false,
      },
      {
        path: "/dashboard/purchases/:purchaseId/editar",
        name: "Editar compra",
        type: "protected",
        element: EditPurchase,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Package,
        keepAlive: true,
        isHeader: false,
        showSidebar: false,
      },
      {
        path: "/dashboard/update-prices",
        name: "Actualizar precios",
        type: "protected",
        element: UpdatePrices,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: PencilLine,
        keepAlive: true,
        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/purchase-general-report",
        name: "Reporte general de compras",
        type: "protected",
        element: PurchaseGeneralReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],

        icon: ScatterChart,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/purchase-mas-comprado-report",
        name: "Reporte de productos más comprados",
        type: "protected",
        element: PurchaseMasCompradoReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],

        icon: TrendingUp,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/purchase-mayor-costo-report",
        name: "Reporte de mayor costo de compra",
        type: "protected",
        element: PurchaseMayorCostoReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],

        icon: DollarSign,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
    ],
  },
];

export default purchasesProtectedRoutes;
