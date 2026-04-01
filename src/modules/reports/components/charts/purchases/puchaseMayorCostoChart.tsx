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
import type { PurchaseReportMayorCostoItem } from "@/modules/reports/types/purchaseReport.types";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const MayorCostoTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0]?.payload as BaseComposedData & {
    grupo: string;
    linea: string;
    codigo: string;
    cantidad: number;
  };

  const subtotal = d.barValue;
  const costoMedio = d.lineValue;

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-60 max-w-72">
      <p
        className="font-semibold text-foreground text-sm mb-1 leading-snug line-clamp-2"
        title={d.name}
      >
        {d.name}
      </p>
      <p className="text-muted-foreground font-mono text-[10px] mb-2">
        {d.codigo}
      </p>
      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
            <span className="text-muted-foreground">Subtotal:</span>
          </div>
          <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-muted-foreground">Costo medio:</span>
          </div>
          <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {formatCurrency(costoMedio)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cantidad:</span>
          <span className="font-semibold tabular-nums">
            {d.cantidad.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex gap-3 pt-1 border-t border-border/50">
          <span className="text-muted-foreground">Grupo:</span>
          <span className="font-medium">{d.grupo}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-foreground">Línea:</span>
          <span className="font-medium">{d.linea}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PurchaseMayorCostoChartProps {
  data: PurchaseReportMayorCostoItem[];
  height?: number | string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PurchaseMayorCostoChart({
  data,
  height = "100%",
}: PurchaseMayorCostoChartProps) {
  const barColors = useChartThemeColors(themeColorPresets.blue);

  const chartData: (BaseComposedData & {
    grupo: string;
    linea: string;
    codigo: string;
    cantidad: number;
  })[] = useMemo(() => {
    return data.map((item) => ({
      name: item.producto,
      barValue: item.subtotal,
      lineValue: item.costo_medio,
      grupo: item.grupo,
      linea: item.linea,
      codigo: item.codigo,
      cantidad: item.cantidad,
    }));
  }, [data]);

  return (
    <BaseComposedChart
      data={chartData}
      colorConfig={{
        type: "gradient",
        barGradientStart: barColors.gradientStart,
        barGradientEnd: barColors.gradientEnd,
        lineColor: "#f59e0b",
        lineGradientOpacity: 0.15,
      }}
      height={height}
      barLabel="Subtotal (Bs)"
      lineLabel="Costo Medio (Bs)"
      barValueFormatter={(v) => formatCurrency(v)}
      lineValueFormatter={(v) => formatCurrency(v)}
      customTooltip={MayorCostoTooltip}
      showArea={true}
      showLegend={true}
      barSize={28}
      xAxisAngle={-35}
      xAxisHeight={70}
      margin={{ top: 20, right: 90, left: 20, bottom: 75 }}
      maxNameLength={30}
    />
  );
}
