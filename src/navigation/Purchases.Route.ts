import CreatePurchase from "@/modules/purchases/screens/CreatePurchase";
import EditPurchase from "@/modules/purchases/screens/EditPurchase";
import PurchaseDetailScreen from "@/modules/purchases/screens/PurchaseDetailScreen";
import PurchaseListScreen from "@/modules/purchases/screens/PurchaseListScreen";
import { Package, ShoppingBag, ShoppingCart } from "lucide-react";
import type RouteType from "./RouteType";

const purchasesProtectedRoutes: RouteType[] = [  
  {
    name: "Compras",
    type: "protected",
    isAdmin: false,
    role: ["admin"],
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
        role: ["admin"],
        icon: ShoppingBag,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/list-purchases",
        name: "Listado de compras",
        type: "protected",
        element: PurchaseListScreen,
        isAdmin: true,
        role: ["admin"],
        icon: Package,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/purchases/:purchaseId",
        name: "Detalle de compra",
        type: "protected",
        element: PurchaseDetailScreen,
        isAdmin: true,
        role: ["admin"],
        icon: Package,

        showInCommandPalette: false,
        isHeader: false,
        showSidebar: false
      },
      {
        path: "/dashboard/purchases/:purchaseId/editar",
        name: "Editar compra",
        type: "protected",
        element: EditPurchase,
        isAdmin: true,
        role: ["admin"],
        icon: Package,

        isHeader: false,
        showSidebar: false
      }
    ]
  }, 
];

export default purchasesProtectedRoutes;