import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Package } from "lucide-react";

// ─── Tipos exportados ────────────────────────────────────────────────────────

export interface BasePieChartData {
  name: string;
  value: number;
  [key: string]: any;
}

/**
 * Misma estructura que en BaseHorizontalBarChart para mantener consistencia.
 * - solid   → color único por slice (usar `sliceColors`)
 * - gradient → gradiente por slice  (usar `sliceColors` con start/end)
 */
export interface PieColorConfig {
  type: "solid" | "gradient";
  /** Colores por slice. Si no alcanza, se repite cíclicamente. */
  sliceColors: PieSliceColor[];
}

export interface PieSliceColor {
  /** Color sólido (se usa cuando type = "solid", o como fallback) */
  color: string;
  /** Inicio del gradiente (se usa cuando type = "gradient") */
  gradientStart?: string;
  /** Final del gradiente (se usa cuando type = "gradient") */
  gradientEnd?: string;
}

export interface PieLabelConfig {
  /** Mostrar u ocultar labels dentro de los slices. Default true */
  show?: boolean;
  /** Porcentaje mínimo para renderizar el label (evita solapamiento). Default 5 */
  minPercentage?: number;
  /** Función custom para formatear el texto mostrado. Recibe el porcentaje (0-100) */
  formatter?: (percentage: number) => string;
  /** Color del texto. Default "white" */
  color?: string;
  /** Tamaño de fuente en px. Default 13 */
  fontSize?: number;
  /** Font weight. Default 600 */
  fontWeight?: number | string;
}

export interface PieLegendConfig {
  /** Mostrar u ocultar la leyenda. Default true */
  show?: boolean;
  /** Posición de la leyenda: "bottom" | "right". Default "bottom" */
  position?: "bottom" | "right";
  /** Componente custom para renderizar cada ítem de la leyenda.
   *  Recibe el dato del slice + su color resuelto. */
  renderItem?: (
    item: BasePieChartData & { resolvedColor: string; index: number }
  ) => ReactNode;
}

export interface BasePieChartProps {
  data: BasePieChartData[];
  /** Key del dato a usar como valor. Default "value" */
  dataKey?: string;
  /** Configuración de colores de los slices */
  colorConfig: PieColorConfig;
  /** Altura del contenedor en px. Default 300 */
  height?: number;
  /** Radio exterior en px. Default 110 */
  outerRadius?: number;
  /** Radio interior en px (0 = pie lleno, >0 = donut). Default 55 */
  innerRadius?: number;
  /** Ángulo de separación entre slices en grados. Default 2 */
  paddingAngle?: number;
  /** Componente tooltip custom. Si no se pasa, usa uno por defecto */
  customTooltip?: (props: any) => ReactNode;
  /** Formatear el valor en el tooltip por defecto */
  valueFormatter?: (value: number) => string;
  /** Configuración de los labels dentro de los slices */
  labelConfig?: PieLabelConfig;
  /** Configuración de la leyenda */
  legendConfig?: PieLegendConfig;
  /** Animar al montar. Default true */
  animate?: boolean;
  /** Duración de la animación en ms. Default 600 */
  animationDuration?: number;
  /** Texto del estado vacío */
  emptyText?: string;
  /** Descripción del estado vacío */
  emptyDescription?: string;
}

// ─── Colores por defecto (misma paleta que PieChartCustom) ──────────────────

const DEFAULT_SLICE_COLORS: PieSliceColor[] = [
  {
    color: "#3b82f6",
    gradientStart: "rgba(59,130,246,0.9)",
    gradientEnd: "rgba(59,130,246,0.4)",
  },
  {
    color: "#10b981",
    gradientStart: "rgba(16,185,129,0.9)",
    gradientEnd: "rgba(16,185,129,0.4)",
  },
  {
    color: "#8b5cf6",
    gradientStart: "rgba(139,92,246,0.9)",
    gradientEnd: "rgba(139,92,246,0.4)",
  },
  {
    color: "#f97316",
    gradientStart: "rgba(249,115,22,0.9)",
    gradientEnd: "rgba(249,115,22,0.4)",
  },
  {
    color: "#ef4444",
    gradientStart: "rgba(239,68,68,0.9)",
    gradientEnd: "rgba(239,68,68,0.4)",
  },
  {
    color: "#06b6d4",
    gradientStart: "rgba(6,182,212,0.9)",
    gradientEnd: "rgba(6,182,212,0.4)",
  },
  {
    color: "#ec4899",
    gradientStart: "rgba(236,72,153,0.9)",
    gradientEnd: "rgba(236,72,153,0.4)",
  },
  {
    color: "#84cc16",
    gradientStart: "rgba(132,204,22,0.9)",
    gradientEnd: "rgba(132,204,22,0.4)",
  },
];

// ─── Helpers internos ────────────────────────────────────────────────────────

function getSliceColor(
  colorConfig: PieColorConfig,
  index: number
): PieSliceColor {
  const palette =
    colorConfig.sliceColors.length > 0
      ? colorConfig.sliceColors
      : DEFAULT_SLICE_COLORS;
  return palette[index % palette.length];
}

function resolveGradientId(index: number) {
  return `pie-grad-${index}`;
}

// ─── Tooltip por defecto ─────────────────────────────────────────────────────

function DefaultTooltip({ active, payload, valueFormatter }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  const value = payload[0].value;
  //   const total =
  //     payload.reduce((_: number, p: any) => _ + p.value, 0) ||
  //     // fallback: calculamos desde payload[0].payload si existe un campo total
  //     value;

  return (
    <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-[160px]">
      <p className="text-foreground font-semibold text-sm mb-2 leading-snug">
        {item.name}
      </p>
      <div className="space-y-1 border-t border-border/40 pt-2">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Valor:</span>
          <span className="font-bold tabular-nums">
            {valueFormatter ? valueFormatter(value) : value.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function BasePieChart({
  data,
  dataKey = "value",
  colorConfig,
  height = 300,
  outerRadius = 110,
  innerRadius = 55,
  paddingAngle = 2,
  customTooltip,
  valueFormatter = (v) => v.toLocaleString(),
  labelConfig,
  legendConfig,
  animate = true,
  animationDuration = 600,
  emptyText = "Sin datos disponibles",
  emptyDescription = "No hay datos para mostrar en el gráfico.",
}: BasePieChartProps) {
  // ── Derivados ──────────────────────────────────────────────────────────────
  const isLabelVisible = labelConfig?.show ?? true;
  const labelMinPct = labelConfig?.minPercentage ?? 5;
  const labelColor = labelConfig?.color ?? "white";
  const labelFontSize = labelConfig?.fontSize ?? 13;
  const labelFontWeight = labelConfig?.fontWeight ?? 600;
  const labelFormatter =
    labelConfig?.formatter ?? ((pct: number) => `${pct.toFixed(0)}%`);

  const showLegend = legendConfig?.show ?? true;
  const legendPos = legendConfig?.position ?? "bottom";
  const legendRenderItem = legendConfig?.renderItem;

  // ── Total para calcular porcentajes ───────────────────────────────────────
  const total = useMemo(
    () => data.reduce((sum, d) => sum + (d[dataKey] ?? 0), 0),
    [data, dataKey]
  );

  // ── Estado vacío ───────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="p-4 rounded-2xl bg-muted/40 mb-4">
          <Package className="size-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {emptyText}
        </h3>
        <p className="text-muted-foreground text-xs text-center max-w-[260px] leading-relaxed">
          {emptyDescription}
        </p>
      </div>
    );
  }

  // ── Label render ───────────────────────────────────────────────────────────
  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius: ir,
    outerRadius: or,
    percent,
  }: any) => {
    const pct = (percent ?? 0) * 100;
    if (pct < labelMinPct) return null;

    const RADIAN = Math.PI / 180;
    const radius = ir + (or - ir) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={labelColor}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: `${labelFontSize}px`,
          fontWeight: labelFontWeight,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
        }}
      >
        {labelFormatter(pct)}
      </text>
    );
  };

  // ── Legend render ──────────────────────────────────────────────────────────
  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    if (legendPos === "right") return null; // se renderiza fuera del SVG

    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3">
        {payload.map((entry: any, index: number) => {
          const sliceColor = getSliceColor(colorConfig, index);
          const item = {
            ...entry.payload,
            resolvedColor: sliceColor.color,
            index,
          };

          if (legendRenderItem) {
            return <div key={`leg-${index}`}>{legendRenderItem(item)}</div>;
          }

          // Default legend item
          const bgStyle =
            colorConfig.type === "gradient" && sliceColor.gradientStart
              ? {
                  background: `linear-gradient(135deg, ${sliceColor.gradientStart}, ${sliceColor.gradientEnd})`,
                }
              : { backgroundColor: sliceColor.color };

          return (
            <div key={`leg-${index}`} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={bgStyle}
              />
              <span className="text-xs text-muted-foreground">
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Legend lateral (posición "right") ─────────────────────────────────────
  const renderRightLegend = () => {
    if (!showLegend || legendPos !== "right") return null;

    return (
      <div className="space-y-2.5 min-w-[180px]">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Distribución
        </div>
        {data.map((item, index) => {
          const sliceColor = getSliceColor(colorConfig, index);
          const pct = total > 0 ? ((item[dataKey] ?? 0) / total) * 100 : 0;
          const enriched = { ...item, resolvedColor: sliceColor.color, index };

          if (legendRenderItem) {
            return (
              <div key={`rleg-${index}`}>{legendRenderItem(enriched)}</div>
            );
          }

          return (
            <div
              key={`rleg-${index}`}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/40 transition-colors"
            >
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: sliceColor.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {valueFormatter(item[dataKey] ?? 0)}
                </div>
              </div>
              <div
                className="text-sm font-bold flex-shrink-0"
                style={{ color: sliceColor.color }}
              >
                {pct.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Tooltip wrapper ────────────────────────────────────────────────────────
  const tooltipContent = customTooltip
    ? customTooltip
    : (props: any) => (
        <DefaultTooltip {...props} valueFormatter={valueFormatter} />
      );

  // ── Render ─────────────────────────────────────────────────────────────────
  const isRightLegend = showLegend && legendPos === "right";

  return (
    <div
      className={`flex ${isRightLegend ? "flex-row lg:flex-row" : "flex-col"} items-center gap-6`}
    >
      {/* Gráfico */}
      <div className={isRightLegend ? "flex-1 w-full min-w-0" : "w-full"}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <defs>
              {colorConfig.type === "gradient" &&
                data.map((_, index) => {
                  const sc = getSliceColor(colorConfig, index);
                  return (
                    <linearGradient
                      key={resolveGradientId(index)}
                      id={resolveGradientId(index)}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={sc.gradientStart ?? sc.color}
                        stopOpacity={1}
                      />
                      <stop
                        offset="100%"
                        stopColor={sc.gradientEnd ?? sc.color}
                        stopOpacity={0.7}
                      />
                    </linearGradient>
                  );
                })}
            </defs>

            <Pie
              data={data}
              cx="50%"
              cy="50%"
              dataKey={dataKey}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              paddingAngle={paddingAngle}
              labelLine={false}
              label={isLabelVisible ? renderLabel : false}
              strokeWidth={2}
              stroke="hsl(var(--border))"
              isAnimationActive={animate}
              animationBegin={0}
              animationDuration={animationDuration}
            >
              {data.map((_, index) => {
                const sc = getSliceColor(colorConfig, index);
                const fill =
                  colorConfig.type === "gradient"
                    ? `url(#${resolveGradientId(index)})`
                    : sc.color;

                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Pie>

            <Tooltip content={tooltipContent} cursor={false} />

            {showLegend && legendPos === "bottom" && (
              <Legend content={renderLegend} />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda lateral */}
      {renderRightLegend()}
    </div>
  );
}
