import {
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  Users,
  Receipt,
} from "lucide-react";
import { BentoMetricCard } from "./BentoMetricCardIcon";
import type {
  DashboardMetrics,
  ReceivableMetrics,
} from "../../hooks/useDashboardData";

interface MetricsGridProps {
  metrics: DashboardMetrics;
  receivableMetrics: ReceivableMetrics;
}

const fmt = (v: number) =>
  `Bs ${v.toLocaleString("es-BO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtN = (v: number) =>
  v.toLocaleString("es-BO", { maximumFractionDigits: 0 });

export function DashboardMetricsGrid({
  metrics,
  receivableMetrics,
}: MetricsGridProps) {
  const kpiCards = [
    {
      title: "Total Ventas",
      value: fmt(metrics.totalVentas),
      icon: DollarSign,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      trend: { value: "12.5%", positive: true },
    },
    {
      title: "Productos Vendidos",
      value: fmtN(metrics.productosVendidos),
      icon: Package,
      accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      trend: { value: "8.2%", positive: true },
    },
    {
      title: "Ticket Promedio",
      value: fmt(metrics.ticketPromedio),
      icon: TrendingUp,
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      title: "Cuentas x Cobrar",
      value: fmt(receivableMetrics.totalDeuda),
      icon: AlertTriangle,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      subtitle: `${receivableMetrics.totalCuentas} pendientes`,
    },
    {
      title: "Clientes Deudores",
      value: fmtN(receivableMetrics.clientesUnicos),
      icon: Users,
      accent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      subtitle: `${receivableMetrics.porcentajeCobrado.toFixed(0)}% cobrado`,
    },
    {
      title: "Transacciones",
      value: fmtN(metrics.totalTransacciones),
      icon: Receipt,
      accent: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    },
  ];

  return (
    <>
      {kpiCards.map((kpi) => (
        <div key={kpi.title} className="col-span-2 min-h-0">
          <BentoMetricCard {...kpi} />
        </div>
      ))}
    </>
  );
}
