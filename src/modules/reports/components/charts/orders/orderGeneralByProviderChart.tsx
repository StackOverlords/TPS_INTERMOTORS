import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";
import {
  BaseHorizontalBarChart,
  type BaseChartData,
} from "@/components/charts/Basehorizontalbarchart";
import type { OrderReportGeneralItem } from "@/modules/reports/types/orderReport.types";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const ProviderTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as BaseChartData & {
    ordenes: number;
    productos: number;
  };

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-56">
      <p
        className="font-semibold text-foreground text-sm mb-2 leading-snug line-clamp-2"
        title={d.name}
      >
        {d.name}
      </p>
      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total comprado:</span>
          <span className="font-bold tabular-nums text-violet-600 dark:text-violet-400">
            {formatCurrency(d.value)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">N° pedidos:</span>
          <span className="font-semibold tabular-nums">{d.ordenes}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Líneas de producto:</span>
          <span className="font-semibold tabular-nums">{d.productos}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrderGeneralByProviderChartProps {
  data: OrderReportGeneralItem[];
  height?: number | string;
  limit?: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function OrderGeneralByProviderChart({
  data,
  //   height = "100%",
  limit = 15,
}: OrderGeneralByProviderChartProps) {
  const colors = useChartThemeColors(themeColorPresets.purple);

  const chartData: (BaseChartData & {
    ordenes: number;
    productos: number;
  })[] = useMemo(() => {
    const grouped = new Map<
      string,
      { subtotal: number; ordenes: Set<number>; productos: number }
    >();

    data.forEach((item) => {
      const existing = grouped.get(item.proveedor) ?? {
        subtotal: 0,
        ordenes: new Set<number>(),
        productos: 0,
      };
      existing.subtotal += item.subtotal;
      existing.ordenes.add(item.nro);
      existing.productos += 1;
      grouped.set(item.proveedor, existing);
    });

    return Array.from(grouped.entries())
      .map(([proveedor, vals]) => ({
        name: proveedor,
        value: vals.subtotal,
        ordenes: vals.ordenes.size,
        productos: vals.productos,
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
      useDynamicHeight={false}
      yAxisWidth={200}
      customTooltip={ProviderTooltip}
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
      margin={{ top: 4, right: 130, left: 8, bottom: 4 }}
    />
  );
}
