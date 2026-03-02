import { useNavigate } from "react-router-dom";
import { useDateFilters } from "../hooks/useDateFilters";
import { useDashboardData } from "../hooks/useDashboardData";
import { DashboardMetricsGrid } from "../components/dashboard/DashboardMetricsGrid";
import { TopSoldCard } from "../components/dashboard/TopSoldCard";
import { TopRevenueCard } from "../components/dashboard/TopRevenueCard";
import { DebtDistributionCard } from "../components/dashboard/DebtDistributionCard";
import { ReceivablesCard } from "../components/dashboard/ReceivablesCard";
import { RecentSalesCard } from "../components/dashboard/RecentSalesCard";
import { QuickActionsCardWrapper } from "../components/dashboard/QuickActionsCardWrapper";
import { DateRangeFilter } from "../components/dashboard/DateRangeFilter";

export default function Dashboard() {
  const navigate = useNavigate();

  // ─── Manejo de filtros jerárquicos ─────────────────────────────────────────
  const { globalRange, setGlobalRange, getEffectiveRange, setCardPeriod } =
    useDateFilters();

  // IDs de cada card que tiene filtro específico
  const CARD_IDS = {
    TOP_SOLD: "top-sold",
    TOP_REVENUE: "top-revenue",
    RECEIVABLES: "receivables",
  };

  // ─── Obtener datos del dashboard ───────────────────────────────────────────
  // Cada card puede tener su propio rango efectivo
  const topSoldRange = getEffectiveRange(CARD_IDS.TOP_SOLD);
  const topRevenueRange = getEffectiveRange(CARD_IDS.TOP_REVENUE);
  const receivablesRange = getEffectiveRange(CARD_IDS.RECEIVABLES);

  // Para el dashboard general usamos el rango global
  const dashboardData = useDashboardData(globalRange);

  // ─── Datos específicos por card ──────────────────────────────────────────
  const topSoldData = useDashboardData(topSoldRange);
  const topRevenueData = useDashboardData(topRevenueRange);
  const receivablesData = useDashboardData(receivablesRange);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-2 p-2 overflow-hidden">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
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

      {/* ─── Bento Grid ───────────────────────────────────────────────────── */}
      <div
        className="flex-1 grid grid-cols-12 gap-2.5 min-h-0"
        style={{ gridTemplateRows: "auto 1fr 1fr" }}
      >
        {/* ─── Row 1: KPI Metrics Cards (6 cards × 2 cols = 12 cols) ─────── */}
        <DashboardMetricsGrid
          metrics={dashboardData.metrics}
          receivableMetrics={dashboardData.receivableMetrics}
        />

        {/* ─── Row 2: Charts Row ──────────────────────────────────────────── */}
        {/* Top Más Vendidos (4 cols) */}
        <TopSoldCard
          data={topSoldData.topSold}
          onNavigate={() => navigate("/dashboard/reports/most-sold")}
          period={null}
          onPeriodChange={(period) => setCardPeriod(CARD_IDS.TOP_SOLD, period)}
          isLoading={topSoldData.isLoading}
        />

        {/* Top Mayor Ingreso (5 cols) */}
        <TopRevenueCard
          data={topRevenueData.topRevenue}
          onNavigate={() => navigate("/dashboard/reports/top-revenue")}
          period={null}
          onPeriodChange={(period) =>
            setCardPeriod(CARD_IDS.TOP_REVENUE, period)
          }
          isLoading={topRevenueData.isLoading}
        />

        {/* Deuda por Cliente - Donut (3 cols) */}
        <DebtDistributionCard
          receivableMetrics={dashboardData.receivableMetrics}
          isError={dashboardData.isError}
          isLoading={dashboardData.isLoading}
        />

        {/* ─── Row 3: Bottom Row ──────────────────────────────────────────── */}
        {/* Cuentas por Cobrar - Stacked Bar (6 cols) */}
        <ReceivablesCard
          data={receivablesData.receivables}
          onNavigate={() => navigate("/reportes/ventas/general")}
          period={null}
          onPeriodChange={(period) =>
            setCardPeriod(CARD_IDS.RECEIVABLES, period)
          }
        />

        {/* Últimas Ventas (3 cols) */}
        <RecentSalesCard />

        {/* Accesos Rápidos (3 cols) */}
        <QuickActionsCardWrapper />
      </div>
    </div>
  );
}
