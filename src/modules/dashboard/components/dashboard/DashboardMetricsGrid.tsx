import {
  DollarSign,
  Receipt,
  TrendingUp,
  BarChart2,
  Wallet,
  Target,
} from "lucide-react";
import { BentoMetricCard } from "./BentoMetricCardIcon";
import type {
  VentasKpis,
  MargenKpis,
  CajaHoyKpis,
  CotizacionesKpis,
} from "../../types/dashboard.types";

interface MetricsGridProps {
  ventas: VentasKpis | undefined;
  margen: MargenKpis | null | undefined;
  cajaHoy: CajaHoyKpis | undefined;
  cotizaciones: CotizacionesKpis | undefined;
  isLoading: boolean;
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtBs = (v: number) =>
  `Bs ${v.toLocaleString("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const fmtN = (v: number) =>
  v.toLocaleString("es-BO", { maximumFractionDigits: 0 });

const fmtPct = (v: number) =>
  `${v.toLocaleString("es-BO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardMetricsGrid({
  ventas,
  margen,
  cajaHoy,
  cotizaciones,
  isLoading,
}: MetricsGridProps) {
  // Delta trend for total ventas
  const deltaTrend =
    ventas?.delta_porcentaje != null
      ? {
          value: `${ventas.delta_porcentaje >= 0 ? "+" : ""}${fmtPct(ventas.delta_porcentaje)}`,
          positive: ventas.delta_porcentaje >= 0,
        }
      : undefined;

  const kpiCards = [
    // 1. Total Ventas
    {
      title: "Total Ventas",
      value: isLoading || !ventas ? "—" : fmtBs(ventas.total_ventas),
      icon: DollarSign,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      trend: deltaTrend,
    },
    // 2. Transacciones
    {
      title: "Transacciones",
      value: isLoading || !ventas ? "—" : fmtN(ventas.total_transacciones),
      icon: Receipt,
      accent: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    },
    // 3. Ticket Promedio
    {
      title: "Ticket Promedio",
      value: isLoading || !ventas ? "—" : fmtBs(ventas.ticket_promedio),
      icon: TrendingUp,
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    // 4. Margen Bruto
    {
      title: "Margen Bruto",
      value:
        isLoading || margen == null
          ? "—"
          : fmtPct(margen.porcentaje_margen),
      icon: BarChart2,
      accent: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    // 5. Caja del Día
    {
      title: "Caja del Día",
      value: isLoading || !cajaHoy ? "—" : fmtBs(cajaHoy.saldo_neto),
      icon: Wallet,
      accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      subtitle: cajaHoy
        ? `${fmtBs(cajaHoy.ingresos)} ing · ${fmtBs(cajaHoy.egresos)} egr`
        : undefined,
    },
    // 6. Tasa de Conversión
    {
      title: "Tasa Conversión",
      value:
        isLoading || !cotizaciones
          ? "—"
          : fmtPct(cotizaciones.tasa_conversion),
      icon: Target,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      subtitle: cotizaciones
        ? `${cotizaciones.convertidas}/${cotizaciones.total} cotizaciones`
        : undefined,
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
