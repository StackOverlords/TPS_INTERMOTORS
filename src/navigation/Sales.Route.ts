import CreateSaleScreen from "@/modules/sales/screens/createSaleScreen";
import SaleDetailScreen from "@/modules/sales/screens/saleDetailScreen";
import SaleEditScreen from "@/modules/sales/screens/saleEditScreen";
import SalesListScreen from "@/modules/sales/screens/salesListScreen";
import { Receipt, ShoppingBag, Table2 } from "lucide-react";
import type RouteType from "./RouteType";

const salesProtectedRoutes: RouteType[] = [ 
  {
    name: "Ventas",
    type: "protected",
    isAdmin: false,
    role: ["admin"],
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
        role: ["admin"],
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
        role: ["admin"],
        icon: Table2,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/sales/:id",
        name: "Detalle de venta",
        type: "protected",
        element: SaleDetailScreen,
        isAdmin: true,
        role: ["admin"],
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
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
    ]
  }, 
];

export default salesProtectedRoutes;