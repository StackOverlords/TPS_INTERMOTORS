import QuotationCreateScreen from "@/modules/quotations/screens/quotationCreateScreen";
import QuotationDetailScreen from "@/modules/quotations/screens/quotationDetailScreen";
import QuotationEditScreen from "@/modules/quotations/screens/quotationEditScreen";
import QuotationListScreen from "@/modules/quotations/screens/quotationListScreen";
import { FileText, Package, ShoppingBag, Table2 } from "lucide-react";
import type RouteType from "./RouteType";

const quotationsProtectedRoutes: RouteType[] = [ 
  {
    name: "Cotizaciones",
    type: "protected",
    isAdmin: false,
    role: ["admin"],
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
        role: ["admin"],
        icon: ShoppingBag,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/quotations",
        name: "Lista de cotizaciones",
        type: "protected",
        element: QuotationListScreen,
        isAdmin: true,
        role: ["admin"],
        icon: Table2,

        isHeader: false,
        showSidebar: true
      },
      {
        path: "/dashboard/quotations/:id",
        name: "Detalle de cotizacion",
        type: "protected",
        element: QuotationDetailScreen,
        isAdmin: true,
        role: ["admin"],
        icon: Package,
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
      {
        path: "/dashboard/quotations/:quotationId/update",
        name: "Editar cotización",
        type: "protected",
        element: QuotationEditScreen,
        isAdmin: true,
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: false
      },
    ]
  }, 
];

export default quotationsProtectedRoutes;