import CreateProduct from "@/modules/products/screens/CreateProduct";
import ProductDetailScreen from "@/modules/products/screens/ProductDetailScreen";
import ProductEditScreen from "@/modules/products/screens/ProductEditScreen";
import ProductListScreen from "@/modules/products/screens/ProductListScreen";
import { BoxIcon, Package, Table2Icon } from "lucide-react";
import type RouteType from "./RouteType";

const productosProtectedRoutes: RouteType[] = [
  {
    name: "Productos",
    type: "protected",
    role: ["admin"],
    isHeader: true,
    showSidebar: true,
    icon: Package,
    subRoutes: [
      {
        path: "/dashboard/create-product",
        name: "Registrar Producto",
        type: "protected",
        element: CreateProduct,
        isAdmin: true,
        role: ["admin"],
        icon: BoxIcon,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/productos",
        name: "Lista de Productos",
        type: "protected",
        element: ProductListScreen,
        isAdmin: true,
        role: ["admin"],
        icon: Table2Icon,
        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/productos/:id",
        name: "Detalle de Producto",
        type: "protected",
        element: ProductDetailScreen,
        isAdmin: true,
        role: ["admin"],
        icon: Package,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
      {
        path: "/dashboard/productos/:productId/update",
        name: "Editar producto",
        type: "protected",
        element: ProductEditScreen,
        isAdmin: true,
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
    ]
  },
];

export default productosProtectedRoutes;