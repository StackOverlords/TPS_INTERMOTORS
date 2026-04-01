import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import {
  BaseComposedChart,
  type BaseComposedData,
} from "@/components/charts/BaseComposedChart";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";
import type { OrderReportTopProveedoresItem } from "@/modules/reports/types/orderReport.types";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TopProveedoresTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0]?.payload as BaseComposedData & {
    ordenes: number;
  };

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-60 max-w-72">
      <p
        className="font-semibold text-foreground text-sm mb-2 leading-snug line-clamp-2"
        title={d.name}
      >
        {d.name}
      </p>
      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
            <span className="text-muted-foreground">Apariciones:</span>
          </div>
          <span className="font-bold tabular-nums text-violet-600 dark:text-violet-400 text-sm">
            {d.barValue.toLocaleString("es-BO")}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="text-muted-foreground">Monto total:</span>
          </div>
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(d.lineValue)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Órdenes únicas:</span>
          <span className="font-semibold tabular-nums">{d.ordenes}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrderTopProveedoresChartProps {
  data: OrderReportTopProveedoresItem[];
  height?: number | string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function OrderTopProveedoresChart({
  data,
  height = "100%",
}: OrderTopProveedoresChartProps) {
  const barColors = useChartThemeColors(themeColorPresets.purple);

  const chartData: (BaseComposedData & { ordenes: number })[] = useMemo(() => {
    return data.map((item) => ({
      name: item.proveedor,
      barValue: item.apariciones,
      lineValue: item.monto_total,
      ordenes: item.ordenes,
    }));
  }, [data]);

  return (
    <BaseComposedChart
      data={chartData}
      colorConfig={{
        type: "gradient",
        barGradientStart: barColors.gradientStart,
        barGradientEnd: barColors.gradientEnd,
        lineColor: "#10b981",
        lineGradientOpacity: 0.15,
      }}
      height={height}
      barLabel="Apariciones"
      lineLabel="Monto Total (Bs)"
      barValueFormatter={(v) =>
        v.toLocaleString("es-BO", { maximumFractionDigits: 0 })
      }
      lineValueFormatter={(v) => formatCurrency(v)}
      customTooltip={TopProveedoresTooltip}
      showArea={true}
      showLegend={true}
      barSize={32}
      xAxisAngle={-30}
      xAxisHeight={70}
      margin={{ top: 20, right: 90, left: 20, bottom: 75 }}
      maxNameLength={25}
    />
  );
}
