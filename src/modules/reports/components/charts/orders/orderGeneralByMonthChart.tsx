import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import {
  BaseAreaChart,
  type BaseAreaData,
} from "@/components/charts/BaseAreaChart";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";
import type { OrderReportGeneralItem } from "@/modules/reports/types/orderReport.types";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const MonthlyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as BaseAreaData & {
    ordenes: number;
    productos: number;
  };

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-52">
      <p className="font-semibold text-foreground text-sm mb-2">{label}</p>
      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total invertido:</span>
          <span className="font-bold tabular-nums text-violet-600 dark:text-violet-400">
            {formatCurrency(d.value)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Pedidos:</span>
          <span className="font-semibold tabular-nums">{d.ordenes}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Líneas:</span>
          <span className="font-semibold tabular-nums">{d.productos}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrderGeneralByMonthChartProps {
  data: OrderReportGeneralItem[];
  height?: number | string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function OrderGeneralByMonthChart({
  data,
  height = "100%",
}: OrderGeneralByMonthChartProps) {
  const colors = useChartThemeColors(themeColorPresets.purple);

  const chartData: (BaseAreaData & {
    ordenes: number;
    productos: number;
  })[] = useMemo(() => {
    const grouped = new Map<
      string,
      { subtotal: number; ordenes: Set<number>; productos: number }
    >();

    data.forEach((item) => {
      // Agrupa por mes (YYYY-MM)
      const mes = item.fecha_pedido.substring(0, 7);
      const existing = grouped.get(mes) ?? {
        subtotal: 0,
        ordenes: new Set<number>(),
        productos: 0,
      };
      existing.subtotal += item.subtotal;
      existing.ordenes.add(item.nro);
      existing.productos += 1;
      grouped.set(mes, existing);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, vals]) => {
        const [year, month] = mes.split("-");
        const monthNames = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];
        const label = `${monthNames[parseInt(month) - 1]} ${year}`;
        return {
          name: label,
          value: vals.subtotal,
          ordenes: vals.ordenes.size,
          productos: vals.productos,
        };
      });
  }, [data]);

  return (
    <BaseAreaChart
      data={chartData}
      colorConfig={{
        type: "gradient",
        strokeColor: colors.gradientStart,
        gradientStart: colors.gradientStart,
        gradientEnd: colors.gradientEnd,
        gradientStartOpacity: 0.35,
        gradientEndOpacity: 0.02,
      }}
      height={height}
      seriesLabel="Inversión"
      yAxisTickFormatter={(v) => formatCurrency(v)}
      customTooltip={MonthlyTooltip}
      showDots={true}
      dotRadius={4}
      strokeWidth={2.5}
      margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
      xAxisAngle={-30}
      xAxisHeight={50}
      emptyMessage="No hay datos por mes"
    />
  );
}
