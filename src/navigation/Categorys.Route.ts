import { FolderOpen, TableCellsMerge } from "lucide-react";
import type RouteType from "./RouteType";
import { lazyScreen } from "./lazyScreen";

const TableCreateCategory = lazyScreen(() => import("@/modules/categories/components/TableCreateCategory"));

const categoryProtectedRoutes: RouteType[] = [
  {
    name: "Categorias",
    type: "protected",
    //element: Content,
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
    icon: FolderOpen,

    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/management-categories",
        name: "Gestionar categorias",
        type: "protected",
        element: TableCreateCategory,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: TableCellsMerge,

        isHeader: false,
        showSidebar: true
      }
    ]
  }
];

export default categoryProtectedRoutes;