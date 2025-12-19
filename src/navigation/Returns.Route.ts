import { CirclePlus, Package, RotateCcw, Table2 } from "lucide-react";
import type RouteType from "./RouteType";
import ReturnListScreen from "@/modules/returns/screens/returnListScreen";
import ReturnDetailScreen from "@/modules/returns/screens/returnDetailScreen";
import ReturnCreateScreen from "@/modules/returns/screens/returnCreateScreen";
import ReturnEditScreen from "@/modules/returns/screens/returnEditScreen";
import { returnsListViewConfig } from "@/modules/returns/config/return.config";

const returnsProtectedRoutes: RouteType[] = [
    {
        name: "Devoluciones",
        type: "protected",
        isAdmin: false,
        role: ["admin"],
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
                role: ["admin"],
                icon: CirclePlus,

                isHeader: false,
                showSidebar: true
            },
            {
                path: "/dashboard/returns",
                name: "Lista de devoluciones",
                type: "protected",
                element: ReturnListScreen,
                isAdmin: true,
                role: ["admin"],
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
                role: ["admin"],
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
                role: ["admin"],
                isHeader: false,
                showSidebar: false,
                showInCommandPalette: false
            },
        ]
    },
];

export default returnsProtectedRoutes;