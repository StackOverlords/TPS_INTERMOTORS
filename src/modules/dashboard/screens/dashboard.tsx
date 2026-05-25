import type { ElementType } from "react";
import { Link } from "react-router";
import {
  ShoppingCart,
  Package,
  Landmark,
  FileText,
  ClipboardList,
  RotateCcw,
  ArrowLeftRight,
  DollarSign,
  FolderOpen,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";

interface ShortcutItem {
  label: string;
  description: string;
  path: string;
  icon: ElementType;
}

const shortcuts: ShortcutItem[] = [
  {
    label: "Ventas",
    description: "Lista de ventas registradas",
    path: "/dashboard/sales",
    icon: ShoppingCart,
  },
  {
    label: "Compras",
    description: "Órdenes de compra a proveedores",
    path: "/dashboard/list-purchases",
    icon: ShoppingBag,
  },
  {
    label: "Caja",
    description: "Sesiones de caja y movimientos",
    path: "/dashboard/caja/sesiones",
    icon: Landmark,
  },
  {
    label: "Productos",
    description: "Catálogo y stock de productos",
    path: "/dashboard/productos",
    icon: Package,
  },
  {
    label: "Cotizaciones",
    description: "Presupuestos y proformas",
    path: "/dashboard/quotations",
    icon: FileText,
  },
  {
    label: "Pedidos",
    description: "Órdenes de pedido",
    path: "/dashboard/orders",
    icon: ClipboardList,
  },
  {
    label: "Devoluciones",
    description: "Gestión de devoluciones",
    path: "/dashboard/returns",
    icon: RotateCcw,
  },
  {
    label: "Transferencias",
    description: "Movimientos entre sucursales",
    path: "/dashboard/transfers",
    icon: ArrowLeftRight,
  },
  {
    label: "Finanzas (CxP)",
    description: "Cuentas por pagar",
    path: "/dashboard/cxp/list",
    icon: DollarSign,
  },
  {
    label: "Cuentas por cobrar",
    description: "Cartera de clientes",
    path: "/dashboard/list-accounts-payable",
    icon: FolderOpen,
  },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Accesos directos a los módulos del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {shortcuts.map(({ label, description, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className="flex items-center gap-3 rounded-lg bg-card p-4 hover:bg-accent/50 transition-colors group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none">{label}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {description}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}
