import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BaseBarColorConfig {
  type: "solid" | "gradient";
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientFromOpacity?: number;
  gradientToOpacity?: number;
}

export interface BaseBarSeries {
  dataKey: string;
  name: string;
  colorConfig: BaseBarColorConfig;
  radius?: [number, number, number, number];
  showBrightness?: boolean;
  brightnessIntensity?: number;
}

export interface BaseBarChartProps {
  data: Record<string, any>[];
  series: BaseBarSeries[];
  nameKey?: string;
  height?: number | string;
  customTooltip?: (props: any) => ReactNode;
  showGrid?: boolean;
  gridOpacity?: number;
  showLegend?: boolean;
  barGap?: number;
  barCategoryGap?: number | string;
  margin?: { top?: number; right?: number; left?: number; bottom?: number };
  xAxisAngle?: number;
  xAxisHeight?: number;
  xAxisTickFormatter?: (value: string) => string;
  yAxisTickFormatter?: (value: number) => string;
  emptyMessage?: string;
  axisFontSize?: number;
  /**
   * Ancho máximo de cada barra en px.
   * Recharts ajusta el ancho automáticamente según el espacio disponible,
   * este valor solo actúa como techo para cuando hay pocos registros.
   * Por defecto 40.
   */
  maxBarSize?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGradientId(dataKey: string, instanceId: string) {
  return `bar-grad-${dataKey}-${instanceId}`;
}

function getBarFill(series: BaseBarSeries, instanceId: string): string {
  if (series.colorConfig.type === "gradient") {
    return `url(#${buildGradientId(series.dataKey, instanceId)})`;
  }
  return series.colorConfig.color || "#3b82f6";
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function BaseBarChart({
  data,
  series,
  nameKey = "name",
  height = "100%",
  customTooltip,
  showGrid = true,
  gridOpacity = 0.5,
  showLegend = true,
  barGap = 4,
  // Espacio entre grupos de barras: string "20%" o número en px.
  // Un valor más alto = más espacio entre grupos = barras más delgadas.
  // Un valor más bajo = menos espacio = barras más gruesas.
  // Recharts por defecto usa "10%". Usamos "20%" para un aspecto más aireado.
  barCategoryGap = "20%",
  margin = { top: 10, right: 20, left: 10, bottom: 50 },
  xAxisAngle = -35,
  xAxisHeight = 55,
  xAxisTickFormatter,
  yAxisTickFormatter = (v) => v.toLocaleString(),
  emptyMessage = "No hay datos para mostrar en el gráfico",
  axisFontSize = 10,
  // Solo un techo: si hay pocos datos y las barras quedarían enormes,
  // las limita. Si hay muchos datos, recharts las achica solo.
  maxBarSize = 80,
}: BaseBarChartProps) {
  const instanceId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        barGap={barGap}
        barCategoryGap={barCategoryGap}
        margin={margin}
      >
        <defs>
          {series.map((s) => {
            if (s.colorConfig.type !== "gradient") return null;
            const id = buildGradientId(s.dataKey, instanceId);
            return (
              <linearGradient key={id} id={id} x1="0" y1="1" x2="0" y2="0">
                <stop
                  offset="0%"
                  stopColor={s.colorConfig.gradientFrom || "#3b82f6"}
                  stopOpacity={s.colorConfig.gradientFromOpacity ?? 0.55}
                />
                <stop
                  offset="100%"
                  stopColor={
                    s.colorConfig.gradientTo ||
                    s.colorConfig.gradientFrom ||
                    "#3b82f6"
                  }
                  stopOpacity={s.colorConfig.gradientToOpacity ?? 1}
                />
              </linearGradient>
            );
          })}
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={gridOpacity}
            vertical={false}
            strokeWidth={0.6}
          />
        )}

        <XAxis
          dataKey={nameKey}
          angle={xAxisAngle}
          textAnchor="end"
          height={xAxisHeight}
          tick={{
            fontSize: axisFontSize,
            fill: "hsl(var(--muted-foreground))",
          }}
          axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 0.5 }}
          tickLine={false}
          tickFormatter={xAxisTickFormatter}
        />

        <YAxis
          tick={{
            fontSize: axisFontSize,
            fill: "hsl(var(--muted-foreground))",
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yAxisTickFormatter}
        />

        <Tooltip
          {...(customTooltip ? { content: customTooltip } : {})}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
            fontSize: "0.75rem",
          }}
          itemStyle={{ color: "hsl(var(--popover-foreground))" }}
          labelStyle={{
            color: "hsl(var(--popover-foreground))",
            fontWeight: 600,
            marginBottom: "4px",
          }}
        />

        {showLegend && (
          <Legend
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: "8px" }}
            content={(props) => {
              const { payload } = props;
              if (!payload?.length) return null;
              return (
                <div className="flex justify-center gap-5 pb-1">
                  {payload.map((entry: any, i: number) => {
                    const s = series.find((s) => s.name === entry.value);
                    const color =
                      s?.colorConfig.type === "gradient"
                        ? (s.colorConfig.gradientTo ??
                          s.colorConfig.gradientFrom ??
                          entry.color)
                        : (s?.colorConfig.color ?? entry.color);
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {entry.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
        )}

        {series.map((s) => {
          const fill = getBarFill(s, instanceId);
          const useBrightness = s.showBrightness ?? false;
          const intensity = s.brightnessIntensity ?? 0.15;

          return (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name}
              fill={fill}
              radius={s.radius ?? [3, 3, 0, 0]}
              maxBarSize={maxBarSize}
              className="drop-shadow-sm"
            >
              {useBrightness
                ? data.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={fill}
                      style={{
                        filter: `brightness(${
                          1 - (index / data.length) * intensity
                        })`,
                      }}
                    />
                  ))
                : null}
            </Bar>
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
