import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";
import type { PurchaseReportGeneralItem } from "@/modules/reports/types/purchaseReport.types";
import {
  BaseHorizontalBarChart,
  type BaseChartData,
} from "@/components/charts/Basehorizontalbarchart";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const GroupTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload;

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-56">
      <p className="font-semibold text-foreground text-sm mb-2 leading-snug">
        {d.name}
      </p>
      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Total comprado:</span>
          <span className="font-bold tabular-nums text-foreground">
            {formatCurrency(d.value)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Cant. productos:</span>
          <span className="font-semibold tabular-nums">{d.count}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Costo prom.:</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(d.avgCosto)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PurchaseGeneralByGroupChartProps {
  data: PurchaseReportGeneralItem[];
  height?: string;
  limit?: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PurchaseGeneralByGroupChart({
  data,
  limit = 20,
}: PurchaseGeneralByGroupChartProps) {
  const colors = useChartThemeColors(themeColorPresets.blue);

  const chartData: (BaseChartData & {
    count: number;
    avgCosto: number;
  })[] = useMemo(() => {
    const grouped = new Map<
      string,
      { subtotal: number; count: number; totalCosto: number }
    >();

    data.forEach((item) => {
      const existing = grouped.get(item.grupo) ?? {
        subtotal: 0,
        count: 0,
        totalCosto: 0,
      };
      grouped.set(item.grupo, {
        subtotal: existing.subtotal + item.subtotal,
        count: existing.count + 1,
        totalCosto: existing.totalCosto + item.costo_medio,
      });
    });

    return Array.from(grouped.entries())
      .map(([grupo, vals]) => ({
        name: grupo,
        value: vals.subtotal,
        count: vals.count,
        avgCosto: vals.count > 0 ? vals.totalCosto / vals.count : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }, [data, limit]);

  return (
    <BaseHorizontalBarChart
      data={chartData}
      colorConfig={{
        type: "gradient",
        gradientStart: colors.gradientStart,
        gradientEnd: colors.gradientEnd,
      }}
      //   height={height}
      useDynamicHeight={false}
      yAxisWidth={170}
      customTooltip={GroupTooltip}
      valueFormatter={(v) => formatCurrency(v)}
      showBrightness={true}
      brightnessIntensity={0.12}
      labelConfig={{
        show: true,
        formatter: (v) => formatCurrency(v),
        fontSize: 10,
        offsetX: 6,
      }}
      axisFontSize={11}
      margin={{ top: 4, right: 120, left: 8, bottom: 4 }}
    />
  );
}
