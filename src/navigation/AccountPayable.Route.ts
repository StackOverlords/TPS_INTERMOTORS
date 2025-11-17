import AccountsPayableListScreen from "@/modules/accountsPayable/screens/AccountsPayableListScreen";
import { FolderOpen, TableCellsMerge } from "lucide-react";
import type RouteType from "./RouteType";

const accountsPayable: RouteType[] = [
  {
    name: "Cuentas por pagar",
    type: "protected",
    //element: Content,
    isAdmin: false,
    role: ["user"],
    icon: FolderOpen,

    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/list-accounts-payable",
        name: "Listar cuentas por pagar",
        type: "protected",
        element: AccountsPayableListScreen,
        isAdmin: true,
        role: ["admin"],
        icon: TableCellsMerge,

        isHeader: false,
        showSidebar: true
      }
    ]
  }
];

export default accountsPayable;