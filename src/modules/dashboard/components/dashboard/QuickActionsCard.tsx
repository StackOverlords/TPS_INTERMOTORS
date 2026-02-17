import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  FileText,
  ClipboardList,
  Undo2,
  Package,
  BarChart3,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionItem {
  title: string;
  icon: LucideIcon;
  description: string;
  path: string;
  color: string;
}

const actions: QuickActionItem[] = [
  {
    title: "Nueva Venta",
    icon: ShoppingCart,
    description: "Registrar una venta rápida",
    path: "/sales/create",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Cotización",
    icon: FileText,
    description: "Crear nueva cotización",
    path: "/quotations/new",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Pedido",
    icon: ClipboardList,
    description: "Registrar un pedido",
    path: "/orders/create",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    title: "Devolución",
    icon: Undo2,
    description: "Procesar devolución",
    path: "/returns/create",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Productos",
    icon: Package,
    description: "Ver inventario completo",
    path: "/products",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    description: "Reportes detallados",
    path: "/reportes/ventas/general",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

export function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col gap-1 overflow-auto scrollbar-thin pr-0.5"
      style={{ maxHeight: "100%" }}
    >
      {actions.map((action) => (
        <button
          key={action.path}
          onClick={() => navigate(action.path)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border/20 bg-card hover:bg-accent/5 hover:border-border/50 transition-all group w-full text-left"
        >
          <div
            className={cn(
              "rounded-lg p-1.5 shrink-0 transition-colors",
              action.color
            )}
          >
            <action.icon className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold leading-tight">
              {action.title}
            </p>
            <p className="text-[8px] text-muted-foreground leading-tight">
              {action.description}
            </p>
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
        </button>
      ))}
    </div>
  );
}
