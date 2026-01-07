import CreateProduct from "@/modules/products/screens/CreateProduct";
import ProductDetailScreen from "@/modules/products/screens/ProductDetailScreen";
import ProductEditScreen from "@/modules/products/screens/ProductEditScreen";
import ProductListScreen from "@/modules/products/screens/ProductListScreen";
import { BoxIcon, Package, Table2Icon } from "lucide-react";
import type RouteType from "./RouteType";
import { productsListViewConfig } from "@/modules/products/config/product.config";

const productosProtectedRoutes: RouteType[] = [
  {
    name: "Productos",
    type: "protected",
    role: ["Administrador","Vendedor","Super Admin","Invitado"],
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
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
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
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        icon: Table2Icon,
        isHeader: false,
        showSidebar: true,
        viewConfig: productsListViewConfig
      },
      {
        path: "/dashboard/productos/:productId",
        name: "Detalle de Producto",
        type: "protected",
        element: ProductDetailScreen,
        isAdmin: true,
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        icon: Package,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
      {
        path: "/dashboard/productos/:updateProductId/update",
        name: "Editar producto",
        type: "protected",
        element: ProductEditScreen,
        isAdmin: true,
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
    ]
  },
];

export default productosProtectedRoutes;