import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import {
  BaseScatterChart,
  type BaseScatterData,
} from "@/components/charts/BaseScatterChart";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";
import type { PurchaseReportGeneralItem } from "@/modules/reports/types/purchaseReport.types";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const ScatterTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as BaseScatterData & {
    grupo: string;
    linea: string;
    codigo: string;
  };

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-60 max-w-72">
      <p
        className="font-semibold text-foreground text-sm mb-1 leading-snug line-clamp-2"
        title={d.name}
      >
        {d.name}
      </p>
      <p className="text-muted-foreground mb-2 font-mono text-[10px]">
        {d.codigo}
      </p>
      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Costo medio:</span>
          <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
            {formatCurrency(d.x)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cantidad:</span>
          <span className="font-bold tabular-nums">
            {d.y.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(d.z)}
          </span>
        </div>
        <div className="flex gap-3 pt-1 border-t border-border/50">
          <span className="text-muted-foreground">Grupo:</span>
          <span className="font-medium text-foreground">{d.grupo}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-foreground">Línea:</span>
          <span className="font-medium text-foreground">{d.linea}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PurchaseGeneralScatterChartProps {
  data: PurchaseReportGeneralItem[];
  height?: number | string;
  limit?: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PurchaseGeneralScatterChart({
  data,
  height = "100%",
  limit = 100,
}: PurchaseGeneralScatterChartProps) {
  const colors = useChartThemeColors(themeColorPresets.blue);

  const chartData: (BaseScatterData & {
    grupo: string;
    linea: string;
    codigo: string;
  })[] = useMemo(() => {
    return data
      .filter((item) => item.costo_medio > 0 && item.cantidad > 0)
      .slice(0, limit)
      .map((item) => ({
        name: item.producto,
        x: item.costo_medio,
        y: item.cantidad,
        z: item.subtotal,
        grupo: item.grupo,
        linea: item.linea,
        codigo: item.codigo,
      }));
  }, [data, limit]);

  return (
    <BaseScatterChart
      data={chartData}
      colorConfig={{
        type: "gradient",
        gradientStart: colors.gradientStart,
        gradientEnd: colors.gradientEnd,
      }}
      height={height}
      xAxisLabel="Costo Medio (Bs)"
      yAxisLabel="Cantidad Comprada"
      customTooltip={ScatterTooltip}
      minPointSize={60}
      maxPointSize={800}
      showBrightness={false}
    />
  );
}
