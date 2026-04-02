import { useMemo } from "react";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";
import {
  BaseHorizontalBarChart,
  type BaseChartData,
} from "@/components/charts/Basehorizontalbarchart";
import type { OrderReportTiempoMedioItem } from "@/modules/reports/types/orderReport.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDays = (days: number): string => {
  if (days === 0) return "< 1 día";
  return `${days} días`;
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TiempoMedioTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as BaseChartData & {
    ordenes_completadas: number;
    dias_minimo: number;
    dias_maximo: number;
    dias_promedio: number;
  };

  const getRangeColor = (days: number) => {
    if (days <= 15) return "text-emerald-600 dark:text-emerald-400";
    if (days <= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-60">
      <p
        className="font-semibold text-foreground text-sm mb-2 leading-snug line-clamp-2"
        title={d.name}
      >
        {d.name}
      </p>
      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Tiempo promedio:</span>
          <span
            className={`font-bold tabular-nums ${getRangeColor(d.dias_promedio)}`}
          >
            {formatDays(d.dias_promedio)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Mínimo:</span>
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatDays(d.dias_minimo)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Máximo:</span>
          <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatDays(d.dias_maximo)}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
          <span className="text-muted-foreground">Órdenes completadas:</span>
          <span className="font-semibold tabular-nums">
            {d.ordenes_completadas}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrderTiempoMedioChartProps {
  data: OrderReportTiempoMedioItem[];
  height?: number | string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function OrderTiempoMedioChart({
  data,
  //   height = "100%",
}: OrderTiempoMedioChartProps) {
  const colors = useChartThemeColors(themeColorPresets.orange);

  const chartData: (BaseChartData & {
    ordenes_completadas: number;
    dias_minimo: number;
    dias_maximo: number;
    dias_promedio: number;
  })[] = useMemo(() => {
    return [...data]
      .sort(
        (a, b) =>
          parseFloat(a.dias_promedio.toString()) -
          parseFloat(b.dias_promedio.toString())
      )
      .map((item) => ({
        name: item.proveedor,
        value: parseFloat(item.dias_promedio.toString()),
        ordenes_completadas: item.ordenes_completadas,
        dias_minimo: item.dias_minimo,
        dias_maximo: item.dias_maximo,
        dias_promedio: parseFloat(item.dias_promedio.toString()),
      }));
  }, [data]);

  return (
    <BaseHorizontalBarChart
      data={chartData}
      colorConfig={{
        type: "gradient",
        gradientStart: colors.gradientStart,
        gradientEnd: colors.gradientEnd,
      }}
      useDynamicHeight={false}
      yAxisWidth={185}
      customTooltip={TiempoMedioTooltip}
      valueFormatter={(v) => `${Math.round(v)} días`}
      showBrightness={false}
      labelConfig={{
        show: true,
        formatter: (v) => `${Math.round(v)} d.`,
        fontSize: 10,
        offsetX: 6,
      }}
      axisFontSize={11}
      margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
    />
  );
}
