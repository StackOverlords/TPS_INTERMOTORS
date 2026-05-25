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
  Users,
  MessagesSquare,
} from "lucide-react";
import { Kbd } from "@/components/atoms/kbd";
import { useThemeStore } from "@/stores/themeStore";
import logoLight from "@/assets/images/logo_light.webp";
import logoDark from "@/assets/images/darkmodeweb.webp";

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
  {
    label: "Usuarios",
    description: "Gestión de usuarios y permisos",
    path: "/dashboard/user",
    icon: Users,
  },
  {
    label: "Chat",
    description: "Comunicación interna",
    path: "/dashboard/chat",
    icon: MessagesSquare,
  },
];

const COLS = 4;

export default function Dashboard() {
  const { resolvedTheme } = useThemeStore();

  return (
    <div className="min-h-full w-full flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-3xl flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <img
            src={resolvedTheme === "dark" ? logoDark : logoLight}
            alt="Intermotors Logo"
            className="h-10 w-auto object-contain transition-opacity duration-300"
          />
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Accede rápidamente a cualquier módulo desde aquí.
          </p>
        </div>

        {/* Grid with fading mask */}
        <div
          className="relative w-full"
          style={{
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black 50%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black 50%, transparent 100%)",
          }}
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {shortcuts.map(({ label, description, path, icon: Icon }, i) => {
              const totalRows = Math.ceil(shortcuts.length / COLS);
              const rowIndex = Math.floor(i / COLS);
              const isLastRow = rowIndex === totalRows - 1;
              const isLastCol = (i + 1) % COLS === 0;

              return (
                <Link
                  key={path}
                  to={path}
                  className={[
                    "group h-28 flex flex-col items-center justify-center text-center gap-1.5 px-3",
                    "transition-colors hover:bg-accent/40 focus:outline-none focus-visible:bg-accent/40",
                    !isLastCol ? "border-r border-border/50" : "",
                    !isLastRow ? "border-b border-border/50" : "",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-xs font-medium leading-tight">{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-[11px] text-muted-foreground/60 mt-10">
          Presiona <Kbd>⌘K</Kbd> para buscar
        </p>
      </div>
    </div>
  );
}
