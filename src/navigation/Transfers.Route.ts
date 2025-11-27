import { transferListConfig } from "@/modules/transfers/config/transfer.config";
import CreateTransfer from "@/modules/transfers/screens/CreateTransfer";
import EditTransfer from "@/modules/transfers/screens/EditTransfer";
import TransferDetailScreen from "@/modules/transfers/screens/TransferDetailScreen";
import TransferListScreen from "@/modules/transfers/screens/TransferListScreen";
import { ArrowLeftRight, Package, Pencil, Shuffle, Table2 } from "lucide-react";
import type RouteType from "./RouteType";

// Transferencias entre sucursales
const transfersProtectedRoutes: RouteType[] = [
  {
    name: "Transferencias",
    type: "protected",
    isAdmin: false,
    role: ["admin"],
    icon: ArrowLeftRight,
    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/transfers",
        name: "Lista de Transferencias",
        type: "protected",
        element: TransferListScreen,
        isAdmin: true,
        role: ["admin"],
        icon: Table2,

        isHeader: false,
        showSidebar: true,

        viewConfig: transferListConfig
      },
      {
        path: "/dashboard/create-transfer",
        name: "Crear Transferencia",
        type: "protected",
        element: CreateTransfer,
        isAdmin: true,
        role: ["admin"],
        icon: Shuffle,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/transfers/:id",
        name: "Detalle de Transferencia",
        type: "protected",
        element: TransferDetailScreen,
        isAdmin: true,
        role: ["admin"],
        icon: Package,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
      {
        path: "/dashboard/transfers/:id/update",
        name: "Editar Transferencia",
        type: "protected",
        element: EditTransfer,
        isAdmin: true,
        role: ["admin"],
        icon: Pencil,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      }
    ]
  },
];

export default transfersProtectedRoutes;