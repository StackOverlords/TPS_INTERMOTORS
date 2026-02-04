import type { ReactNode } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

export interface BaseComposedData {
  name: string;
  barValue: number; // cantidad
  lineValue: number; // precio_medio
  [key: string]: any;
}

export interface ColorConfig {
  type: "solid" | "gradient";
  barColor?: string;
  lineColor?: string;
  barGradientStart?: string;
  barGradientEnd?: string;
  lineGradientOpacity?: number;
}

export interface BaseComposedChartProps {
  data: BaseComposedData[];
  colorConfig: ColorConfig;
  height?: number | string;
  limit?: number;
  customTooltip?: (props: any) => ReactNode;
  barLabel?: string;
  lineLabel?: string;
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
  showLegend?: boolean;
  maxNameLength?: number;
  barValueFormatter?: (value: number) => string;
  lineValueFormatter?: (value: number) => string;
  barSize?: number;
  xAxisAngle?: number;
  xAxisHeight?: number;
  showArea?: boolean;
  showRightAxisLine?: boolean;
}

export function BaseComposedChart({
  data,
  colorConfig,
  height = "100%",
  limit = 15,
  customTooltip,
  barLabel = "Cantidad",
  lineLabel = "Precio Medio",
  showBrightness = true,
  brightnessIntensity = 0.15,
  barRadius = [6, 6, 0, 0],
  showGrid = true,
  gridOpacity = 0.5,
  margin = { top: 30, right: 80, left: 20, bottom: 80 },
  showLegend = true,
  maxNameLength = 35,
  barValueFormatter = (value) => value.toLocaleString(),
  lineValueFormatter = (value) =>
    value.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  barSize = 35,
  xAxisAngle = -45,
  xAxisHeight = 80,
  showArea = true,
  showRightAxisLine = false,
}: BaseComposedChartProps) {
  const chartData = data.slice(0, limit);

  const barGradientId = `bar-gradient`;

  const getBarColor = () => {
    if (colorConfig.type === "gradient") {
      return `url(#${barGradientId})`;
    }
    return colorConfig.barColor || "#3b82f6";
  };

  const lineColor = colorConfig.lineColor || "#f59e0b";

  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const truncatedData = chartData.map((item) => ({
    ...item,
    name: truncateText(item.name, maxNameLength),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>No hay datos para mostrar en el gráfico</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={truncatedData} margin={margin}>
        <defs>
          {colorConfig.type === "gradient" && (
            <linearGradient id={barGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={colorConfig.barGradientStart || "#3b82f6"}
                stopOpacity={1}
              />
              <stop
                offset="100%"
                stopColor={colorConfig.barGradientEnd || "#dbeafe"}
                stopOpacity={0.8}
              />
            </linearGradient>
          )}
          {/* Gradient para el área debajo de la línea */}
          <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={lineColor}
              stopOpacity={colorConfig.lineGradientOpacity || 0.2}
            />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            stroke="hsl(var(--border))"
            opacity={gridOpacity}
            strokeWidth={0.6}
          />
        )}

        <XAxis
          dataKey="name"
          angle={xAxisAngle}
          textAnchor="end"
          height={xAxisHeight}
          fontSize={10}
          interval={0}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          yAxisId="left"
          orientation="left"
          tickFormatter={barValueFormatter}
          fontSize={11}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={lineValueFormatter}
          fontSize={11}
          stroke={lineColor}
          tickLine={false}
          axisLine={
            showRightAxisLine ? { strokeWidth: 1, stroke: lineColor } : false
          }
        />

        <Tooltip
          content={customTooltip || undefined}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
        />

        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: "10px" }}
            verticalAlign="top"
            content={(props) => {
              const { payload } = props;
              if (!payload || payload.length === 0) return null;

              const filteredPayload = payload.filter((entry: any) => {
                return entry.type !== "none";
              });

              return (
                <div className="flex justify-center gap-6 mb-4">
                  {filteredPayload.map((entry: any, index: number) => {
                    const isLine = entry.dataKey === "lineValue";
                    return (
                      <div
                        key={`legend-${index}`}
                        className="flex items-center gap-2"
                      >
                        {isLine ? (
                          // Icono de línea
                          <div
                            className="w-4 h-0.5 rounded"
                            style={{ backgroundColor: entry.color }}
                          />
                        ) : (
                          // Icono de barra (cuadrado redondeado)
                          <div
                            className="w-4 h-3 rounded"
                            style={{
                              backgroundColor:
                                colorConfig.barColor ||
                                colorConfig.barGradientStart ||
                                "#3b82f6",
                            }}
                          />
                        )}
                        <span className="text-sm text-muted-foreground">
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

        {/* Área con degradado debajo de la línea */}
        {showArea && (
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="lineValue"
            fill="url(#lineAreaGradient)"
            stroke="none"
            legendType="none"
          />
        )}

        <Bar
          yAxisId="left"
          dataKey="barValue"
          name={barLabel}
          fill={getBarColor()}
          radius={barRadius}
          barSize={barSize}
          className="drop-shadow-sm"
        >
          {showBrightness &&
            chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor()}
                style={{
                  filter: `brightness(${1 - (index / chartData.length) * brightnessIntensity})`,
                }}
              />
            ))}
        </Bar>

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="lineValue"
          name={lineLabel}
          stroke={lineColor}
          strokeWidth={3}
          dot={{
            fill: lineColor,
            r: 5,
            strokeWidth: 2,
            stroke: "#fff",
          }}
          activeDot={{
            r: 7,
            strokeWidth: 2,
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
