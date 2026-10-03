import {
  FolderOpen,
  TableCellsMerge,
  FileText,
  CheckCircle2,
  User,
} from "lucide-react";
import type RouteType from "./RouteType";
import { lazyScreen } from "./lazyScreen";

const AccountsReceivableListScreen = lazyScreen(() => import("@/modules/accountsReceivable/screens/AccountsReceivableListScreen"));
const AccountsReceivableGeneralReportScreen = lazyScreen(() => import("@/modules/accountsReceivable/screens/AccountsReceivableGeneralReportScreen"));
const AccountsReceivablePaidReportScreen = lazyScreen(() => import("@/modules/accountsReceivable/screens/AccountsReceivablePaidReportScreen"));
const AccountsReceivableByCustomerReportScreen = lazyScreen(() => import("@/modules/accountsReceivable/screens/AccountsReceivableByCustomerReportScreen"));

const accountsReceivable: RouteType[] = [
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
        element: AccountsReceivableListScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin", "Invitado"],
        icon: TableCellsMerge,

        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/reports/accounts-receivable-general",
        name: "Reporte General",
        type: "protected",
        element: AccountsReceivableGeneralReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: FileText,

        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/reports/accounts-receivable-paid",
        name: "Reporte Pagadas",
        type: "protected",
        element: AccountsReceivablePaidReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: CheckCircle2,

        isHeader: false,
        showSidebar: true,
      },
      {
        path: "/dashboard/reports/accounts-receivable-by-customer",
        name: "Reporte Por Cliente",
        type: "protected",
        element: AccountsReceivableByCustomerReportScreen,
        isAdmin: true,
        role: ["Administrador", "Vendedor", "Super Admin"],
        icon: User,

        isHeader: false,
        showSidebar: true,
      },
    ],
  },
];

export default accountsReceivable;
