import { UserDetailScreen, CreateUserScreen, EditUserScreen } from "@/modules/users";
import { userDetailsConfig, userListConfig } from "@/modules/users/config/user.config";
import UserListScreen from "@/modules/users/screens/UserListScreen";
import { BoxIcon, UserCogIcon, UserPlus, Users } from "lucide-react";
import type RouteType from "./RouteType";

const usuariosProtectedRoutes: RouteType[] = [
  {
    name: "Usuarios",
    type: "protected",
    role: ["Administrador", "Super Admin"],
    isHeader: true,
    showSidebar: true,
    icon: Users,
    subRoutes: [

      {
        path: "/dashboard/user/create",
        name: "Crear Usuario",
        type: "protected",
        element: CreateUserScreen,
        isAdmin: true,
        role: ["Super Admin"],
        icon: UserPlus,

        isHeader: false,
        showSidebar: false,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/user",
        name: "Listar Usuarios",
        type: "protected",
        element: UserListScreen,
        isAdmin: true,
        role: ["Administrador", "Super Admin"],
        icon: UserCogIcon,

        isHeader: false,
        showSidebar: true,

        viewConfig: userListConfig
      },
      {
        path: "/dashboard/user/edit/:id",
        name: "Editar Usuario",
        type: "protected",
        element: EditUserScreen,
        isAdmin: true,
        role: ["Super Admin"],
        icon: BoxIcon,

        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,
      },
      {
        path: "/dashboard/user/:nickname",
        name: "Detalle de Usuario",
        type: "protected",
        element: UserDetailScreen,
        isAdmin: true,
        role: ["Super Admin"],
        icon: BoxIcon,

        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false,

        viewConfig: userDetailsConfig
      },
    ]
  }
];

export default usuariosProtectedRoutes;