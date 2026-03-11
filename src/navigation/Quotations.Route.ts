import QuotationCreateScreen from "@/modules/quotations/screens/quotationCreateScreen";
import QuotationDetailScreen from "@/modules/quotations/screens/quotationDetailScreen";
import QuotationEditScreen from "@/modules/quotations/screens/quotationEditScreen";
import QuotationListScreen from "@/modules/quotations/screens/quotationListScreen";
import { FileText, Package, ShoppingBag, Table2 } from "lucide-react";
import type RouteType from "./RouteType";
import { quotationsListViewConfig } from "@/modules/quotations/config/quotation.config";

const quotationsProtectedRoutes: RouteType[] = [
  {
    name: "Cotizaciones",
    type: "protected",
    isAdmin: false,
    role: ["Administrador","Vendedor","Super Admin","Invitado"],
    icon: FileText,
    isHeader: true,
    showSidebar: true,
    subRoutes: [
      {
        path: "/dashboard/create-quotation",
        name: "Registrar cotización",
        type: "protected",
        element: QuotationCreateScreen,
        isAdmin: true,
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        icon: ShoppingBag,
        keepAlive: true,
        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/quotations",
        name: "Lista de cotizaciones",
        type: "protected",
        element: QuotationListScreen,
        isAdmin: true,
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        icon: Table2,
        viewConfig: quotationsListViewConfig,
        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/quotations/:quotationId",
        name: "Detalle de cotizacion",
        type: "protected",
        element: QuotationDetailScreen,
        isAdmin: true,
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        icon: Package,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
      {
        path: "/dashboard/quotations/:updateQuotationId/update",
        name: "Editar cotización",
        type: "protected",
        element: QuotationEditScreen,
        isAdmin: true,
        role: ["Administrador","Vendedor","Super Admin","Invitado"],
        keepAlive: true,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
    ]
  },
];

export default quotationsProtectedRoutes;