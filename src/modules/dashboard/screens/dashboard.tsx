import { format } from "date-fns";
import { ShoppingCart } from "lucide-react";
import { useDateFilters } from "../hooks/useDateFilters";
import { useDashboardKpis } from "../hooks/useDashboardKpis";
import { useDashboardAlertas } from "../hooks/useDashboardAlertas";
import { useDashboardFeed } from "../hooks/useDashboardFeed";
import { DashboardMetricsGrid } from "../components/dashboard/DashboardMetricsGrid";
import { TendenciaChart } from "../components/dashboard/TendenciaChart";
import { AlertasPanel } from "../components/dashboard/AlertasPanel";
import { RecentSalesFeed } from "../components/dashboard/RecentSalesFeed";
import { AgingCxcCard } from "../components/dashboard/AgingCxcCard";
import { DateRangeFilter } from "../components/dashboard/DateRangeFilter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";

export default function Dashboard() {
  // ─── Date range state ─────────────────────────────────────────────────────
  const { globalRange, setGlobalRange } = useDateFilters();

  const fechaInicio = format(globalRange.from, "yyyy-MM-dd");
  const fechaFin = format(globalRange.to, "yyyy-MM-dd");

  // ─── Data hooks ───────────────────────────────────────────────────────────
  const kpisData = useDashboardKpis({ fechaInicio, fechaFin });
  const alertasData = useDashboardAlertas();
  const feedData = useDashboardFeed();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-2 p-2 overflow-hidden">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg lg:text-xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen general del negocio
          </p>
        </div>
        <DateRangeFilter
          from={globalRange.from}
          to={globalRange.to}
          onChange={(f, t) => setGlobalRange(f, t)}
        />
      </div>

      {/* ─── Bento Grid ──────────────────────────────────────────────────── */}
      <div
        className="flex-1 grid grid-cols-12 gap-2.5 min-h-0"
        style={{ gridTemplateRows: "auto 1fr 1fr" }}
      >
        {/* ─── Row 1: KPI Metrics Cards (6 × col-span-2 = 12 cols) ──────── */}
        <DashboardMetricsGrid
          ventas={kpisData.data?.ventas}
          margen={kpisData.data?.margen}
          cajaHoy={kpisData.data?.caja_hoy}
          cotizaciones={kpisData.data?.cotizaciones}
          isLoading={kpisData.isLoading}
        />

        {/* ─── Row 2: Tendencia (7 cols) + Alertas (5 cols) ────────────── */}
        <div className="col-span-7 min-h-0">
          <TendenciaChart
            data={kpisData.data?.tendencia_diaria ?? []}
            isLoading={kpisData.isLoading}
          />
        </div>

        <div className="col-span-5 min-h-0">
          <AlertasPanel
            data={alertasData.data}
            isLoading={alertasData.isLoading}
          />
        </div>

        {/* ─── Row 3: Feed (6 cols) + Cartera CxC (6 cols) ────────────── */}
        <div className="col-span-6 min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-border/40">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-3 pb-0 shrink-0">
              <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                <ShoppingCart className="size-4 text-emerald-500" />
                Últimas Ventas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 pt-1 min-h-0">
              <RecentSalesFeed
                items={feedData.data?.ventas_hoy ?? []}
                isLoading={feedData.isLoading}
              />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-6 min-h-0">
          <AgingCxcCard
            data={alertasData.data?.cxc}
            isLoading={alertasData.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
