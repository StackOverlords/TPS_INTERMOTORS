import type { ReactNode } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AreaChartSkeleton, ChartError } from "./ChartSkeletons";

export interface BaseAreaData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface AreaColorConfig {
  type: "solid" | "gradient";
  strokeColor: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientStartOpacity?: number;
  gradientEndOpacity?: number;
}

export interface BaseAreaChartProps {
  data: BaseAreaData[];
  colorConfig: AreaColorConfig;
  dataKey?: string;
  nameKey?: string;
  height?: number | string;
  customTooltip?: (props: any) => ReactNode;
  seriesLabel?: string;
  showGrid?: boolean;
  gridOpacity?: number;
  showLegend?: boolean;
  showDots?: boolean;
  dotRadius?: number;
  activeDotRadius?: number;
  strokeWidth?: number;
  areaType?: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter";
  margin?: {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
  };
  xAxisAngle?: number;
  xAxisHeight?: number;
  yAxisTickFormatter?: (value: number) => string;
  xAxisTickFormatter?: (value: string) => string;
  showArea?: boolean;
  showRightAxisLine?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => void;
}

export function BaseAreaChart({
  data,
  colorConfig,
  dataKey = "value",
  nameKey = "name",
  height = "100%",
  customTooltip,
  seriesLabel = "Valor",
  showGrid = true,
  gridOpacity = 0.4,
  showLegend = false,
  showDots = true,
  dotRadius = 4,
  activeDotRadius = 6,
  strokeWidth = 2.5,
  areaType = "monotone",
  margin = { top: 10, right: 20, left: 10, bottom: 30 },
  xAxisAngle = -35,
  xAxisHeight = 60,
  yAxisTickFormatter = (v) => v.toLocaleString(),
  xAxisTickFormatter,
  showArea = true,
  emptyMessage = "No hay datos para mostrar en el gráfico",
  isLoading = false,
  isError = false,
  refetch,
}: BaseAreaChartProps) {
  const gradientId = `area-gradient-${dataKey}`;

  const getFill = () => {
    if (!showArea) return "none";
    if (colorConfig.type === "gradient") return `url(#${gradientId})`;
    return colorConfig.strokeColor + "33"; // 20% opacity solid fallback
  };

  if (isLoading) return <AreaChartSkeleton />;
  if (isError) return <ChartError onRetry={refetch} />;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={margin}>
        <defs>
          {colorConfig.type === "gradient" && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={colorConfig.gradientStart || colorConfig.strokeColor}
                stopOpacity={colorConfig.gradientStartOpacity ?? 0.4}
              />
              <stop
                offset="100%"
                stopColor={colorConfig.gradientEnd || colorConfig.strokeColor}
                stopOpacity={colorConfig.gradientEndOpacity ?? 0.02}
              />
            </linearGradient>
          )}
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={gridOpacity}
            vertical={false}
          />
        )}

        <XAxis
          dataKey={nameKey}
          angle={xAxisAngle}
          textAnchor="end"
          height={xAxisHeight}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
          tickFormatter={xAxisTickFormatter}
        />

        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={yAxisTickFormatter}
        />

        <Tooltip content={customTooltip || undefined} />

        {showLegend && (
          <Legend
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: "10px" }}
            content={(props) => {
              const { payload } = props;
              if (!payload?.length) return null;
              return (
                <div className="flex justify-center gap-6 mb-2">
                  {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-4 h-0.5 rounded"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
        )}

        <Area
          type={areaType}
          dataKey={dataKey}
          name={seriesLabel}
          stroke={colorConfig.strokeColor}
          strokeWidth={strokeWidth}
          fill={getFill()}
          dot={
            showDots
              ? {
                  r: dotRadius,
                  fill: colorConfig.strokeColor,
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))",
                }
              : false
          }
          activeDot={{ r: activeDotRadius }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
