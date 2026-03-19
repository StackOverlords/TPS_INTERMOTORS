import QuotationCreateScreen from "@/modules/quotations/screens/quotationCreateScreen";
import QuotationDetailScreen from "@/modules/quotations/screens/quotationDetailScreen";
import QuotationEditScreen from "@/modules/quotations/screens/quotationEditScreen";
import QuotationListScreen from "@/modules/quotations/screens/quotationListScreen";
import QuotationReportGeneralScreen from "@/modules/quotations/screens/reports/QuotationReportGeneralScreen";
import QuotationReportConversionScreen from "@/modules/quotations/screens/reports/QuotationReportConversionScreen";
import QuotationReportTopClientesScreen from "@/modules/quotations/screens/reports/QuotationReportTopClientesScreen";
import QuotationReportProductosScreen from "@/modules/quotations/screens/reports/QuotationReportProductosScreen";
import QuotationReportAbiertasScreen from "@/modules/quotations/screens/reports/QuotationReportAbiertasScreen";
import QuotationReportDesempenoScreen from "@/modules/quotations/screens/reports/QuotationReportDesempenoScreen";
import {
  BarChart3,
  Clock,
  FileText,
  Package,
  Package2,
  ShoppingBag,
  Table2,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
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
      {
        path: "/dashboard/cotizaciones-reporte-general",
        name: "Reporte General",
        type: "protected",
        element: QuotationReportGeneralScreen,
        isAdmin: true,
        role: ["Administrador", "Super Admin"],
        icon: BarChart3,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/cotizaciones-reporte-conversion",
        name: "Reporte de Conversión",
        type: "protected",
        element: QuotationReportConversionScreen,
        isAdmin: true,
        role: ["Administrador", "Super Admin"],
        icon: TrendingUp,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/cotizaciones-reporte-top-clientes",
        name: "Top Clientes",
        type: "protected",
        element: QuotationReportTopClientesScreen,
        isAdmin: true,
        role: ["Administrador", "Super Admin"],
        icon: Trophy,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/cotizaciones-reporte-productos",
        name: "Productos Cotizados",
        type: "protected",
        element: QuotationReportProductosScreen,
        isAdmin: true,
        role: ["Administrador", "Super Admin"],
        icon: Package2,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/cotizaciones-reporte-abiertas",
        name: "Cotizaciones Abiertas",
        type: "protected",
        element: QuotationReportAbiertasScreen,
        isAdmin: true,
        role: ["Administrador", "Super Admin"],
        icon: Clock,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
      {
        path: "/dashboard/cotizaciones-reporte-desempeno",
        name: "Desempeño de Vendedores",
        type: "protected",
        element: QuotationReportDesempenoScreen,
        isAdmin: true,
        role: ["Administrador", "Super Admin"],
        icon: Users,
        isHeader: false,
        showSidebar: true,
        showInCommandPalette: true,
      },
    ]
  },
];

export default quotationsProtectedRoutes;