import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import {
  BaseBarChart,
  type BaseBarSeries,
  type BaseBarColorConfig,
} from "@/components/charts/BaseBarChart";
import {
  themeColorPresets,
  useChartThemeColors,
} from "@/hooks/charts/useChartThemeColors";
import type { KardexReportItem } from "../../types/kardexReport.types";

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface KardexBarData {
  name: string;
  fecha: string;
  entrada: number;
  salida: number;
  tipo_transaccion: string;
  num_transaccion: string;
  proveedor_cliente: string;
  cantidad: number;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const EntradasSalidasTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload as KardexBarData;
  const entrada = d.entrada ?? 0;
  const salida = d.salida ?? 0;
  const neto = entrada - salida;

  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-64">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-border/50">
        <span className="font-mono text-muted-foreground">
          {d.num_transaccion}
        </span>
        <span className="text-muted-foreground tabular-nums">{d.fecha}</span>
      </div>

      {/* Proveedor / Cliente */}
      {d.proveedor_cliente && (
        <p className="text-foreground font-medium mb-2 leading-snug">
          {d.proveedor_cliente}
        </p>
      )}

      {/* Cantidad */}
      <div className="flex justify-between gap-4 mb-2">
        <span className="text-muted-foreground">Cantidad:</span>
        <span className="font-semibold tabular-nums">
          {d.cantidad.toLocaleString("es-BO", { maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Entrada / Salida */}
      <div className="space-y-1 pt-1 border-t border-border/50">
        {entrada > 0 && (
          <div className="flex justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span className="text-muted-foreground">Entrada:</span>
            </div>
            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(entrada)}
            </span>
          </div>
        )}
        {salida > 0 && (
          <div className="flex justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-red-500 dark:bg-red-400" />
              <span className="text-muted-foreground">Salida:</span>
            </div>
            <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(salida)}
            </span>
          </div>
        )}
        {entrada > 0 && salida > 0 && (
          <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
            <span className="text-muted-foreground font-medium">Neto:</span>
            <span
              className={`font-bold tabular-nums ${
                neto >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(neto)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface KardexEntradasSalidasChartProps {
  data: KardexReportItem[];
  height?: number | string;
  /** Límite visual controlado desde el padre via chartVisualLimit del hook */
  limit?: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function KardexEntradasSalidasChart({
  data,
  height = 240,
  limit,
}: KardexEntradasSalidasChartProps) {
  // Colores tema-aware desde los presets existentes
  const entradaColors = useChartThemeColors(themeColorPresets.green);
  const salidaColors = useChartThemeColors(themeColorPresets.red);

  const series: BaseBarSeries[] = useMemo(
    () => [
      {
        dataKey: "entrada",
        name: "Entradas",
        maxBarSize: 24,
        radius: [3, 3, 0, 0] as [number, number, number, number],
        colorConfig: {
          type: "gradient",
          gradientFrom: entradaColors.gradientEnd, // bottom: semitransparente
          gradientTo: entradaColors.gradientStart, // top: sólido
          gradientFromOpacity: 0.55,
          gradientToOpacity: 1,
        } satisfies BaseBarColorConfig,
      },
      {
        dataKey: "salida",
        name: "Salidas",
        maxBarSize: 24,
        radius: [3, 3, 0, 0] as [number, number, number, number],
        colorConfig: {
          type: "gradient",
          gradientFrom: salidaColors.gradientEnd, // bottom: semitransparente
          gradientTo: salidaColors.gradientStart, // top: sólido
          gradientFromOpacity: 0.55,
          gradientToOpacity: 1,
        } satisfies BaseBarColorConfig,
      },
    ],
    [entradaColors, salidaColors]
  );

  const chartData: KardexBarData[] = useMemo(() => {
    const slice = limit != null ? data.slice(0, limit) : data;
    return slice.map((item) => ({
      name: item.fecha,
      fecha: item.fecha,
      entrada: item.entrada_total,
      salida: item.salida_total,
      tipo_transaccion: item.tipo_transaccion,
      num_transaccion: item.num_transaccion,
      proveedor_cliente: item.proveedor_cliente,
      cantidad: item.cantidad,
    }));
  }, [data, limit]);

  return (
    <BaseBarChart
      data={chartData}
      series={series}
      nameKey="name"
      height={height}
      customTooltip={EntradasSalidasTooltip}
      showGrid
      showLegend
      barGap={2}
      margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
      xAxisAngle={-35}
      xAxisHeight={55}
      axisFontSize={9}
      yAxisTickFormatter={(v) => formatCurrency(v)}
      emptyMessage="No hay movimientos para mostrar"
    />
  );
}
