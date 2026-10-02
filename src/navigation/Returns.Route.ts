import { CirclePlus, Package, RotateCcw, Table2 } from "lucide-react";
import type RouteType from "./RouteType";
import { returnsListViewConfig } from "@/modules/returns/config/return.config";
import { lazyScreen } from "./lazyScreen";

const ReturnListScreen = lazyScreen(() => import("@/modules/returns/screens/returnListScreen"));
const ReturnDetailScreen = lazyScreen(() => import("@/modules/returns/screens/returnDetailScreen"));
const ReturnCreateScreen = lazyScreen(() => import("@/modules/returns/screens/returnCreateScreen"));
const ReturnEditScreen = lazyScreen(() => import("@/modules/returns/screens/returnEditScreen"));

const returnsProtectedRoutes: RouteType[] = [
    {
        name: "Devoluciones",
        type: "protected",
        isAdmin: false,
        role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
        icon: RotateCcw,
        isHeader: true,
        showSidebar: true,
        subRoutes: [
            {
                path: "/dashboard/create-return",
                name: "Registrar devolución",
                type: "protected",
                element: ReturnCreateScreen,
                isAdmin: true,
                role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
                icon: CirclePlus,
                keepAlive: true,
                isHeader: false,
                showSidebar: true
            },
            {
                path: "/dashboard/returns",
                name: "Lista de devoluciones",
                type: "protected",
                element: ReturnListScreen,
                isAdmin: true,
                role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
                icon: Table2,
                viewConfig: returnsListViewConfig,
                isHeader: false,
                showSidebar: true
            },
            {
                path: "/dashboard/returns/:returnCod",
                name: "Detalle de Devolución",
                type: "protected",
                element: ReturnDetailScreen,
                isAdmin: true,
                role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
                icon: Package,
                isHeader: false,
                showSidebar: false,
                showInCommandPalette: false
            },
            {
                path: "/dashboard/returns/:returnId/update",
                name: "Editar Devolución",
                type: "protected",
                element: ReturnEditScreen,
                isAdmin: true,
                role: ["Administrador", "Vendedor", "Super Admin","Invitado"],
                keepAlive: true,
                isHeader: false,
                showSidebar: false,
                showInCommandPalette: false
            },
        ]
    },
];

export default returnsProtectedRoutes;