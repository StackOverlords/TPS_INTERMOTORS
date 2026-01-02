import AccountsPayableListScreen from "@/modules/accountsPayable/screens/AccountsPayableListScreen";
import { FolderOpen, TableCellsMerge } from "lucide-react";
import type RouteType from "./RouteType";

const accountsPayable: RouteType[] = [
  {
    name: "Cuentas por cobrar",
    type: "protected",
    //element: Content,
    isAdmin: false,
    role: ["Administrador","Vendedor"],
    icon: FolderOpen,

    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/list-accounts-payable",
        name: "Listar cuentas por cobrar",
        type: "protected",
        element: AccountsPayableListScreen,
        isAdmin: true,
        role: ["Administrador","Vendedor"],
        icon: TableCellsMerge,

        isHeader: false,
        showSidebar: true
      }
    ]
  }
];

export default accountsPayable;