import CreateProduct from "@/modules/products/screens/CreateProduct";
import ProductDetailScreen from "@/modules/products/screens/ProductDetailScreen";
import ProductEditScreen from "@/modules/products/screens/ProductEditScreen";
import ProductListScreen from "@/modules/products/screens/ProductListScreen";
import {
  AreaChartIcon,
  BoxIcon,
  Package,
  Table2Icon,
  DollarSign,
  Warehouse,
  List,
} from "lucide-react";
import type RouteType from "./RouteType";
import { productsListViewConfig } from "@/modules/products/config/product.config";
import ProductoStockReports from "@/modules/products/screens/ProductoStockReports";
import UtilidadesReportScreen from "@/modules/products/screens/UtilidadesReportScreen";
import InventarioReportScreen from "@/modules/products/screens/InventarioReportScreen";
import KardexReportScreen from "@/modules/reports/screens/products/KardexReportScreen";

const productosProtectedRoutes: RouteType[] = [
  {
    name: "Productos",
    type: "protected",
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
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
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: BoxIcon,

        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/productos",
        name: "Lista de Productos",
        type: "protected",
        element: ProductListScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Table2Icon,
        isHeader: false,
        showSidebar: true,
        viewConfig: productsListViewConfig,
      },
      {
        path: "/dashboard/productos/:productId",
        name: "Detalle de Producto",
        type: "protected",
        element: ProductDetailScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: Package,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,
      },
      {
        path: "/dashboard/productos/:updateProductId/update",
        name: "Editar producto",
        type: "protected",
        element: ProductEditScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,
      },
      {
        path: "/dashboard/stock-minimo",
        name: "Stock Reportes",
        type: "protected",
        element: ProductoStockReports,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],

        icon: AreaChartIcon,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/utilidades-reporte",
        name: "Reporte de Utilidades",
        type: "protected",
        element: UtilidadesReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],

        icon: DollarSign,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/inventario-reporte",
        name: "Reporte de Inventario",
        type: "protected",
        element: InventarioReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],

        icon: Warehouse,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/kardex-report",
        name: "Reporte de Kardex",
        type: "protected",
        element: KardexReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],

        icon: List,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
    ],
  },
];

export default productosProtectedRoutes;
