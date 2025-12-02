import { UserDetailScreen } from "@/modules/users";
import { userDetailsConfig, userListConfig } from "@/modules/users/config/user.config";
import UserListScreen from "@/modules/users/screens/UserListScreen";
import { BoxIcon, UserCogIcon, Users } from "lucide-react";
import type RouteType from "./RouteType";

const usuariosProtectedRoutes: RouteType[] = [ 
  {
    name: "Usuarios",
    type: "protected",
    role: ["admin"],
    isHeader: true,
    showSidebar: true,
    icon: Users,
    subRoutes: [
      {
        path: "/dashboard/user",
        name: "Listar Usuarios",
        type: "protected",
        element: UserListScreen,
        isAdmin: true,
        role: ["admin"],
        icon: UserCogIcon,

        isHeader: false,
        showSidebar: true,

        viewConfig:userListConfig
      },
      {
        path: "/dashboard/user/:nickname",
        name: "Detalle de Usuario",
        type: "protected",
        element: UserDetailScreen,
        isAdmin: true,
        role: ["admin"],
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