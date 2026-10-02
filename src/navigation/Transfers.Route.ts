import { transferListConfig } from "@/modules/transfers/config/transfer.config";
import { ArrowLeftRight, Package, Pencil, Plus, Shuffle, Table2 } from "lucide-react";
import type RouteType from "./RouteType";
import { lazyScreen } from "./lazyScreen";

const CreateTransfer = lazyScreen(() => import("@/modules/transfers/screens/CreateTransfer"));
const EditTransfer = lazyScreen(() => import("@/modules/transfers/screens/EditTransfer"));
const TransferDetailScreen = lazyScreen(() => import("@/modules/transfers/screens/TransferDetailScreen"));
const TransferListScreen = lazyScreen(() => import("@/modules/transfers/screens/TransferListScreen"));
const TransferRequestCreatePage = lazyScreen(() => import("@/modules/transfers/screens/TransferRequestCreatePage"));

// Transferencias entre sucursales
const transfersProtectedRoutes: RouteType[] = [
  {
    name: "Transferencias",
    type: "protected",
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
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
        role: ["Administrador", "Vendedor", "Super Admin", "Super Admin", "Invitado"],
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
        role: ["Administrador", "Vendedor", "Super Admin", "Super Admin", "Invitado"],
        icon: Shuffle,
        keepAlive: true,
        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/transfers/request/new",
        name: "Solicitar Transferencia",
        type: "protected",
        element: TransferRequestCreatePage,
        isAdmin: false,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: Plus,
        keepAlive: true,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true
      },
      {
        path: "/dashboard/transfers/:id",
        name: "Detalle de Transferencia",
        type: "protected",
        element: TransferDetailScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Super Admin", "Invitado"],
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
        role: ["Administrador", "Vendedor", "Super Admin", "Super Admin", "Invitado"],
        icon: Pencil,
        keepAlive: true,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      }
    ]
  },
];

export default transfersProtectedRoutes;