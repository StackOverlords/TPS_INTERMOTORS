import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  FileText,
  ClipboardList,
  Undo2,
  Package,
  ChevronRight,
  type LucideIcon,
  DollarSign,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/button";

interface QuickActionItem {
  title: string;
  icon: LucideIcon;
  description: string;
  path: string;
  color: string;
}

const actions: QuickActionItem[] = [
  {
    title: "Productos",
    icon: Package,
    description: "Ver inventario completo",
    path: "/dashboard/productos",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "Nueva Venta",
    icon: DollarSign,
    description: "Registrar una venta rápida",
    path: "/dashboard/create-sale",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Cotización",
    icon: FileText,
    description: "Crear nueva cotización",
    path: "/dashboard/create-quotation",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Compras",
    icon: ShoppingCart,
    description: "Registrar nueva compra",
    path: "/dashboard/create-purchase",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    title: "Pedido",
    icon: ClipboardList,
    description: "Registrar un pedido",
    path: "/dashboard/create-order",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    title: "Devolución",
    icon: Undo2,
    description: "Procesar devolución",
    path: "/dashboard/create-return",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Lista de Ventas",
    icon: List,
    description: "Ver todas las ventas",
    path: "/dashboard/sales",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
];

export function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col gap-2 overflow-auto scrollbar-thin pr-0.5"
      style={{ maxHeight: "100%" }}
    >
      {actions.map((action) => (
        <Button
          key={action.path}
          onClick={() => navigate(action.path)}
          className="flex items-center gap-2.5 px-2.5 py-2 transition-all group text-left h-auto"
          variant={"secondary"}
        >
          <div
            className={cn(
              "rounded-lg p-1.5 shrink-0 transition-colors",
              action.color
            )}
          >
            <action.icon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {action.title}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              {action.description}
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
        </Button>
      ))}
    </div>
  );
}
