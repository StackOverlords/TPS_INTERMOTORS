import CreatePurchase from "@/modules/purchases/screens/CreatePurchase";
import EditPurchase from "@/modules/purchases/screens/EditPurchase";
import PurchaseDetailScreen from "@/modules/purchases/screens/PurchaseDetailScreen";
import PurchaseListScreen from "@/modules/purchases/screens/PurchaseListScreen";
import UpdatePrices from "@/modules/purchases/screens/UpdatePrices";
import { Package, PencilLine, ShoppingBag, ShoppingCart } from "lucide-react";
import type RouteType from "./RouteType";

const purchasesProtectedRoutes: RouteType[] = [  
  {
    name: "Compras",
    type: "protected",
    isAdmin: false,
    role: ["Administrador","Vendedor","Super Admin","Invitado"],
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
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        icon: ShoppingBag,
        keepAlive: true,
        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/list-purchases",
        name: "Lista de compras",
        type: "protected",
        element: PurchaseListScreen,
        isAdmin: true,
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
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
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
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
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        icon: Package,
        keepAlive: true,
        isHeader: false,
        showSidebar: false
      },
      {
        path: "/dashboard/update-prices",
        name: "Actualizar precios",
        type: "protected",
        element: UpdatePrices,
        isAdmin: true,
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        icon: PencilLine,

        isHeader: false,
        showSidebar: true
      },
    ]
  }, 
];

export default purchasesProtectedRoutes;