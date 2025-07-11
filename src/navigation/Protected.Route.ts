import type RouteType from "./RouteType";
// import ProductScreen from "@/modules/products/screens/ProductScreen";
// Importa un componente para el dashboard principal
import Content from "@/modules/dashboard/screens/content"; // Necesitas crear este componente
import { BarChart3Icon, DollarSignIcon, HomeIcon, LayoutDashboardIcon, PlusIcon, StoreIcon, UserCogIcon, UsersIcon } from "lucide-react";
import CreateProduct from "@/modules/products/screens/CreateProduct";
import CreateCategory from "@/modules/products/screens/Categories/CreateCategory";

const protectedRoutes: RouteType[] = [
  {
    path: "/dashboard",
    name: "Dashboard",
    type: "protected",
    element: Content,
    isAdmin: false,
    role: "user",
    icon: LayoutDashboardIcon
  },
  //productos
  // {
  //   path: "/dashboard/producto-lista",
  //   name: "Productos",
  //   type: "protected",
  //   element: ProductScreen,
  //   isAdmin: true,
  //   role: "admin",
  //   icon: HomeIcon
  // },
  {
    path: "/dashboard/create-producto",
    name: "Crear Producto",
    type: "protected",
    element: CreateProduct,
    isAdmin: true,
    role: "admin",
    icon: HomeIcon
  },
  {
    path: "/dashboard/create-category",
    name: "Crear Categoría",
    type: "protected",
    element: CreateCategory,
    isAdmin: true,
    role: "admin",
    icon: PlusIcon
  },
  //compras
  {
    path: "/dashboard/compras",
    name: "Compras",
    type: "protected",
    //element: Content,
    isAdmin: false,
    role: "user",
    icon: HomeIcon
  },
  {
    path: "/dashboard/compras/crear",
    name: "Registrar Compra",
    type: "protected",
    //element: CreatePurchase,
    isAdmin: true,
    role: "admin",
    icon: PlusIcon
  },
  // Ventas
  {
    path: "/dashboard/ventas",
    name: "Ventas",
    type: "protected",
    //element: SaleList,
    isAdmin: true,
    role: "admin",
    icon: DollarSignIcon
  },
  {
    path: "/dashboard/ventas/crear",
    name: "Registrar Venta",
    type: "protected",
    //element: CreateSale,
    isAdmin: true,
    role: "admin",
    icon: PlusIcon
  },

  // Clientes
  {
    path: "/dashboard/clientes",
    name: "Clientes",
    type: "protected",
    //element: ClientList,
    isAdmin: true,
    role: "admin",
    icon: UsersIcon
  },
  {
    path: "/dashboard/clientes/crear",
    name: "Registrar Cliente",
    type: "protected",
    //element: CreateClient,
    isAdmin: true,
    role: "admin",
    icon: PlusIcon
  },

  // Proveedores
  {
    path: "/dashboard/proveedores",
    name: "Proveedores",
    type: "protected",
    //element: SupplierList,
    isAdmin: true,
    role: "admin",
    icon: StoreIcon
  },
  {
    path: "/dashboard/proveedores/crear",
    name: "Registrar Proveedor",
    type: "protected",
    //element: CreateSupplier,
    isAdmin: true,
    role: "admin",
    icon: PlusIcon
  },

  // Almacenes
  {
    path: "/dashboard/almacenes",
    name: "Almacenes",
    type: "protected",
    //element: WarehouseList,
    isAdmin: true,
    role: "admin",
    icon: StoreIcon
  },
  {
    path: "/dashboard/almacenes/crear",
    name: "Crear Almacén",
    type: "protected",
    //element: CreateWarehouse,
    isAdmin: true,
    role: "admin",
    icon: PlusIcon
  },

  // Usuarios
  {
    path: "/dashboard/usuarios",
    name: "Usuarios",
    type: "protected",
    //element: UserList,
    isAdmin: true,
    role: "admin",
    icon: UserCogIcon
  },
  {
    path: "/dashboard/usuarios/crear",
    name: "Registrar Usuario",
    type: "protected",
    //element: CreateUser,
    isAdmin: true,
    role: "admin",
    icon: PlusIcon
  },

  // Reportes
  {
    path: "/dashboard/reportes",
    name: "Reportes",
    type: "protected",
    //element: ReportScreen,
    isAdmin: true,
    role: "admin",
    icon: BarChart3Icon
  }
]; 

export default protectedRoutes;