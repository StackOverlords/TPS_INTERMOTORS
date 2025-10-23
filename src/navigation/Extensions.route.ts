import { FolderOpen } from "lucide-react";
import type RouteType from "./RouteType";

const ExtensionsRoutes: RouteType[] = [
  {
    name: "Categorias",
    type: "protected",
    //element: Content,
    isAdmin: false,
    role: ["user"],
    icon: FolderOpen,

    isHeader: true,
    showSidebar: true,
    // subRoutes: [
    //   {
    //     path: "/dashboard/management-categories",
    //     name: "Gestionar categorias",
    //     type: "protected",
    //     element: TableCreateCategory,
    //     isAdmin: true,
    //     role: ["admin"],
    //     icon: TableCellsMerge,

    //     isHeader: false,
    //     showSidebar: true
    //   }
    // ]
  }
];

export default ExtensionsRoutes;