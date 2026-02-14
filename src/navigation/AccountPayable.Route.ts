import AccountsPayableListScreen from "@/modules/accountsPayable/screens/AccountsPayableListScreen";
import AccountsReceivableGeneralReportScreen from "@/modules/accountsPayable/screens/AccountsReceivableGeneralReportScreen";
import AccountsReceivablePaidReportScreen from "@/modules/accountsPayable/screens/AccountsReceivablePaidReportScreen";
import AccountsReceivableByCustomerReportScreen from "@/modules/accountsPayable/screens/AccountsReceivableByCustomerReportScreen";
import { FolderOpen, TableCellsMerge, FileText, CheckCircle2, User } from "lucide-react";
import type RouteType from "./RouteType";

const accountsPayable: RouteType[] = [
  {
    name: "Cuentas por cobrar",
    type: "protected",
    //element: Content,
    isAdmin: false,
    role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
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
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: TableCellsMerge,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/reports/accounts-receivable-general",
        name: "Reporte General",
        type: "protected",
        element: AccountsReceivableGeneralReportScreen,
        isAdmin: true,
        role: ["Super Admin"],
        icon: FileText,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/reports/accounts-receivable-paid",
        name: "Reporte Pagadas",
        type: "protected",
        element: AccountsReceivablePaidReportScreen,
        isAdmin: true,
        role: ["Super Admin"],
        icon: CheckCircle2,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/reports/accounts-receivable-by-customer",
        name: "Reporte Por Cliente",
        type: "protected",
        element: AccountsReceivableByCustomerReportScreen,
        isAdmin: true,
        role: ["Super Admin"],
        icon: User,

        isHeader: false,
        showSidebar: true
      }
    ]
  }
];

export default accountsPayable;