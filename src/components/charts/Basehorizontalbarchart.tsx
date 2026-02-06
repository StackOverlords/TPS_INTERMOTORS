import type { ReactNode } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

export interface BaseChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ColorConfig {
  type: "solid" | "gradient";
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  lightColor?: string;
  darkColor?: string;
  lightGradientStart?: string;
  lightGradientEnd?: string;
  darkGradientStart?: string;
  darkGradientEnd?: string;
}

export interface LabelConfig {
  /** Mostrar u ocultar el label. Por defecto true si se pasa el objeto */
  show?: boolean;
  /** Función custom para formatear el valor mostrado. Si no se pasa, usa el valueFormatter del componente */
  formatter?: (value: number) => string;
  /** Color del texto del label para valores positivos */
  color?: string;
  /** Color del texto del label para valores negativos. Si no se pasa, usa el mismo que positivos */
  negativeColor?: string;
  /** Tamaño de fuente en px */
  fontSize?: number;
  /** Offset horizontal desde el final de la barra en px */
  offsetX?: number;
  /** Font weight del texto */
  fontWeight?: number | string;
}

export interface BaseHorizontalBarChartProps {
  data: BaseChartData[];
  dataKey?: string;
  colorConfig: ColorConfig;
  height?: number;
  minHeight?: number;
  barHeight?: number;
  limit?: number;
  yAxisWidth?: number;
  customTooltip?: (props: any) => ReactNode;
  valueFormatter?: (value: number) => string;
  showBrightness?: boolean;
  brightnessIntensity?: number;
  barRadius?: [number, number, number, number];
  showGrid?: boolean;
  gridOpacity?: number;
  margin?: {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
  };
  /** Si es false, el height del contenedor será "100%" en vez del valor calculado */
  useDynamicHeight?: boolean;
  /** Si es false, oculta la leyenda. Por defecto es true */
  showLegend?: boolean;
  /** Texto personalizado que se muestra en la leyenda (reemplaza el dataKey) */
  legendName?: string;
  /** Configuración del label de valor al final de cada barra */
  labelConfig?: LabelConfig;
}

export function BaseHorizontalBarChart({
  data,
  dataKey = "value",
  colorConfig,
  height,
  minHeight = 300,
  barHeight = 38,
  limit = 15,
  yAxisWidth = 180,
  customTooltip,
  valueFormatter = (value) => value.toLocaleString(),
  showBrightness = true,
  brightnessIntensity = 0.15,
  barRadius = [0, 8, 8, 0],
  showGrid = true,
  gridOpacity = 1,
  margin = { top: 5, right: 30, left: 20, bottom: 5 },
  useDynamicHeight = false,
  showLegend = false,
  legendName,
  labelConfig,
}: BaseHorizontalBarChartProps) {
  const chartData = data.slice(0, limit);

  const dynamicHeight = useDynamicHeight
    ? height || Math.max(minHeight, chartData.length * barHeight)
    : "100%";

  const gradientPositiveId = `gradient-pos-${dataKey}`;
  const gradientNegativeId = `gradient-neg-${dataKey}`;

  const getBarFill = (value: number) => {
    if (colorConfig.type === "gradient") {
      return value < 0
        ? `url(#${gradientNegativeId})`
        : `url(#${gradientPositiveId})`;
    }
    return colorConfig.color || "#3b82f6";
  };

  const getGradientColors = () => {
    if (colorConfig.type === "gradient") {
      if (colorConfig.gradientStart && colorConfig.gradientEnd) {
        return {
          start: colorConfig.gradientStart,
          end: colorConfig.gradientEnd,
        };
      }
      return {
        start: colorConfig.lightGradientStart || "rgba(59, 130, 246, 1)",
        end: colorConfig.lightGradientEnd || "rgba(59, 130, 246, 0.55)",
      };
    }
    return null;
  };

  const gradientColors = getGradientColors();

  // Si se pasa labelConfig, el label está activo por defecto (show ?? true)
  // Si no se pasa labelConfig, no hay label
  const isLabelVisible = labelConfig ? (labelConfig.show ?? true) : false;
  const labelFormatter = labelConfig?.formatter ?? valueFormatter;
  const labelPositiveColor =
    labelConfig?.color ?? "hsl(var(--muted-foreground))";
  const labelNegativeColor = labelConfig?.negativeColor ?? "#ef4444";
  const labelFontSize = labelConfig?.fontSize ?? 12;
  const labelOffsetX = labelConfig?.offsetX ?? 8;
  const labelFontWeight = labelConfig?.fontWeight ?? 500;

  const renderLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const isNegative = value < 0;

    return (
      <text
        x={isNegative ? x + width - labelOffsetX : x + width + labelOffsetX}
        y={y + height / 2}
        fill={isNegative ? labelNegativeColor : labelPositiveColor}
        fontSize={labelFontSize}
        fontWeight={labelFontWeight}
        dominantBaseline="middle"
        textAnchor={isNegative ? "end" : "start"}
      >
        {labelFormatter(value)}
      </text>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>No hay datos para mostrar en el gráfico</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={dynamicHeight}>
      <BarChart data={chartData} layout="vertical" margin={margin}>
        <defs>
          {colorConfig.type === "gradient" && gradientColors && (
            <>
              {/* Positivos: oscuro hacia la derecha */}
              <linearGradient
                id={gradientPositiveId}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor={gradientColors.end}
                  stopOpacity={0.5}
                />
                <stop
                  offset="100%"
                  stopColor={gradientColors.start}
                  stopOpacity={1}
                />
              </linearGradient>
              {/* Negativos: oscuro hacia la izquierda (mismos colores, dirección invertida) */}
              <linearGradient
                id={gradientNegativeId}
                x1="1"
                y1="0"
                x2="0"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor={gradientColors.end}
                  stopOpacity={0.5}
                />
                <stop
                  offset="100%"
                  stopColor={gradientColors.start}
                  stopOpacity={1}
                />
              </linearGradient>
            </>
          )}
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={true}
            stroke="hsl(var(--border))"
            opacity={gridOpacity}
            strokeWidth={0.6}
            syncWithTicks={true}
          />
        )}

        <XAxis
          type="number"
          tickFormatter={valueFormatter}
          fontSize={12}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={{ strokeWidth: 0.5, stroke: "hsl(var(--border))" }}
        />

        <YAxis
          type="category"
          dataKey="name"
          width={yAxisWidth}
          fontSize={12}
          tickLine={false}
          axisLine={{ strokeWidth: 0.5, stroke: "hsl(var(--border))" }}
          stroke="hsl(var(--muted-foreground))"
        />

        <Tooltip
          content={customTooltip || undefined}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.8 }}
        />

        {showLegend && <Legend formatter={() => legendName || dataKey} />}

        <Bar
          dataKey={dataKey}
          name={legendName || dataKey}
          radius={barRadius}
          fill={getBarFill(0)}
          className="drop-shadow-sm"
          label={isLabelVisible ? renderLabel : false}
        >
          {showBrightness &&
            chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarFill(entry[dataKey])}
                style={{
                  filter: `brightness(${1 - (index / chartData.length) * brightnessIntensity})`,
                }}
              />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
