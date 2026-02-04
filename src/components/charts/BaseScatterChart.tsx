import type { ReactNode } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
  Cell,
} from "recharts";

export interface BaseScatterData {
  x: number; // precio_medio
  y: number; // cantidad
  z: number; // total (para tamaño del punto)
  name: string;
  [key: string]: any;
}

export interface ColorConfig {
  type: "solid" | "gradient";
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
}

export interface BaseScatterChartProps {
  data: BaseScatterData[];
  colorConfig: ColorConfig;
  height?: number | string;
  limit?: number;
  customTooltip?: (props: any) => ReactNode;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  gridOpacity?: number;
  margin?: {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
  };
  showLegend?: boolean;
  legendName?: string;
  minPointSize?: number;
  maxPointSize?: number;
  showBrightness?: boolean;
  brightnessIntensity?: number;
}

export function BaseScatterChart({
  data,
  colorConfig,
  height = "100%",
  limit = 50,
  customTooltip,
  xAxisLabel = "Precio Medio (Bs)",
  yAxisLabel = "Cantidad Vendida",
  showGrid = true,
  gridOpacity = 0.5,
  margin = { top: 20, right: 30, left: 20, bottom: 60 },
  showLegend = false,
  legendName = "Productos",
  minPointSize = 100,
  maxPointSize = 1000,
  showBrightness = true,
  brightnessIntensity = 0.2,
}: BaseScatterChartProps) {
  const chartData = data.slice(0, limit);

  const gradientId = `scatter-gradient`;

  const getPointColor = () => {
    if (colorConfig.type === "gradient") {
      return `url(#${gradientId})`;
    }
    return colorConfig.color || "#3b82f6";
  };

  const formatCurrency = (value: number) => {
    return `Bs ${value.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString("es-BO", {
      maximumFractionDigits: 0,
    });
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>No hay datos para mostrar en el gráfico</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={margin}>
        <defs>
          {colorConfig.type === "gradient" && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop
                offset="0%"
                stopColor={colorConfig.gradientStart || "#3b82f6"}
                stopOpacity={0.8}
              />
              <stop
                offset="100%"
                stopColor={colorConfig.gradientEnd || "#1e40af"}
                stopOpacity={1}
              />
            </linearGradient>
          )}
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={gridOpacity}
            strokeWidth={0.6}
          />
        )}

        <XAxis
          type="number"
          dataKey="x"
          name={xAxisLabel}
          tickFormatter={formatCurrency}
          fontSize={12}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          label={{
            value: xAxisLabel,
            position: "bottom",
            offset: 0,
            style: {
              fontSize: 12,
              fill: "hsl(var(--muted-foreground))",
            },
          }}
        />

        <YAxis
          type="number"
          dataKey="y"
          name={yAxisLabel}
          tickFormatter={formatNumber}
          fontSize={12}
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          label={{
            value: yAxisLabel,
            angle: -90,
            position: "insideLeft",
            style: {
              fontSize: 12,
              fill: "hsl(var(--muted-foreground))",
            },
          }}
        />

        <ZAxis
          type="number"
          dataKey="z"
          range={[minPointSize, maxPointSize]}
          name="Total Ventas"
        />

        <Tooltip
          content={customTooltip || undefined}
          cursor={{ strokeDasharray: "3 3" }}
        />

        {showLegend && <Legend formatter={() => legendName} />}

        <Scatter
          name={legendName}
          data={chartData}
          fill={getPointColor()}
          className="drop-shadow-md"
        >
          {showBrightness &&
            chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getPointColor()}
                style={{
                  filter: `brightness(${1 - (index / chartData.length) * brightnessIntensity})`,
                }}
              />
            ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
