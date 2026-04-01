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
import type { PurchaseReportMasCompradoItem } from "@/modules/reports/types/purchaseReport.types";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const MasCompradoTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as BaseChartData & {
    grupo: string;
    linea: string;
    codigo: string;
    subtotal: number;
    costoMedio: number;
  };

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
          <span className="text-muted-foreground">Cantidad:</span>
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 text-sm">
            {d.value.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Costo medio:</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(d.costoMedio)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(d.subtotal)}
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

export interface PurchaseMasCompradoChartProps {
  data: PurchaseReportMasCompradoItem[];
  height?: number | string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PurchaseMasCompradoChart({
  data,
}: PurchaseMasCompradoChartProps) {
  const colors = useChartThemeColors(themeColorPresets.green);

  const chartData: (BaseChartData & {
    grupo: string;
    linea: string;
    codigo: string;
    subtotal: number;
    costoMedio: number;
  })[] = useMemo(() => {
    return data.map((item) => ({
      name: item.producto,
      value: item.cantidad,
      grupo: item.grupo,
      linea: item.linea,
      codigo: item.codigo,
      subtotal: item.subtotal,
      costoMedio: item.costo_medio,
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
      yAxisWidth={200}
      customTooltip={MasCompradoTooltip}
      valueFormatter={(v) =>
        v.toLocaleString("es-BO", { maximumFractionDigits: 0 })
      }
      showBrightness={true}
      brightnessIntensity={0.12}
      labelConfig={{
        show: true,
        formatter: (v) =>
          v.toLocaleString("es-BO", { maximumFractionDigits: 0 }),
        fontSize: 10,
        offsetX: 6,
      }}
      axisFontSize={11}
      margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
    />
  );
}
